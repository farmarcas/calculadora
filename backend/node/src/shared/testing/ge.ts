import ExcelJS from 'exceljs';
import request from 'supertest';
import { deduzirFuncao } from '../../modules/cadastros/processar.js';
import { lerDias, lerHora } from '../../modules/escala/interpretar.js';
import { app } from '../../app.js';
import { prisma } from '../database/prisma.js';
import { GE_INICIAL_ID } from '../ge.js';

// Ajudantes dos testes de integração: criam GEs próprios e limpam o que o teste criou (o GE inicial fica).
export const criarGe = (identificacao: string, nome = `GE ${identificacao}`) =>
  prisma.grupoEconomico.create({ data: { identificacao, nome } });

export const limparGes = async () => {
  const fora = { geId: { not: GE_INICIAL_ID } };
  await prisma.auditoria.deleteMany({ where: fora });
  await prisma.importacaoCadastro.deleteMany({ where: fora });
  await prisma.grupoEconomico.deleteMany({ where: { id: { not: GE_INICIAL_ID } } });
};

export const cabecalhosDoGe = (geId: string, perfil = 'TENANT_ADMIN') => ({
  'X-Perfil': perfil,
  'X-GE': geId,
});

// Como `request(app)`, mas já dentro de um GE (o inicial, se nenhum for dado).
export const reqGe = (geId: string = GE_INICIAL_ID) => {
  const t = request(app);
  return {
    get: (url: string) => t.get(url).set('X-GE', geId),
    // A planilha de escala foi aposentada (spec 026): o que os testes chamam de "enviar a escala" agora cadastra os
    // funcionários e os horários no Cadastro, que é a única fonte da equipe.
    post: (url: string) =>
      url.endsWith('/cargas/escala')
        ? (escalaNoCadastro(geId) as unknown as ReturnType<typeof t.post>)
        : t.post(url).set('X-GE', geId),
    put: (url: string) => t.put(url).set('X-GE', geId),
    patch: (url: string) => t.patch(url).set('X-GE', geId),
    delete: (url: string) => t.delete(url).set('X-GE', geId),
  };
};

// CNPJ válido e diferente a cada chamada (a loja nova exige CNPJ, e ele é único no sistema).
let sequencia = 10_000_000;
export const cnpjValido = () => {
  const base = `${sequencia++}0001`;
  const digito = (d: string, pesos: number[]) => {
    const r = [...d].reduce((s, c, i) => s + Number(c) * pesos[i]!, 0) % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = digito(base, p1);
  const d2 = digito(`${base}${d1}`, [6, ...p1]);
  return `${base}${d1}${d2}`;
};

// Cria loja pela API como o operador (só ele cria loja), com CNPJ válido se o corpo não trouxer um.
export const postLoja = (body: Record<string, unknown>, geId: string = GE_INICIAL_ID) =>
  reqGe(geId)
    .post('/api/v1/lojas')
    .set('X-Perfil', 'PLATFORM_OPERATOR')
    .send({ cnpj: cnpjValido(), ...body });

// Lê uma planilha no formato antigo da escala (Cod_Loja, ID_Colaborador, Nome_Colaborador, Funcao, Dias_Trabalho, Hora_Entrada,
// Inicio_Intervalo, Fim_Intervalo, Hora_Saida, Carga_Horaria) e grava cada linha como funcionário da loja. Linhas de loja
// inexistente ou sem horário são puladas. É "thenable" para aceitar o mesmo encadeamento `.set(...).attach(...)` dos testes.
const escalaNoCadastro = (geId: string) => {
  let buffer: Buffer | null = null;
  const cadeia = {
    set: () => cadeia,
    attach: (_campo: string, buf: Buffer) => {
      buffer = buf;
      return cadeia;
    },
    then: (ok: (v: unknown) => unknown, falha?: (e: unknown) => unknown) =>
      executar().then(ok, falha),
  };
  const executar = async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as never);
    const ws = wb.worksheets[0]!;
    const cab = (ws.getRow(1).values as unknown[])
      .slice(1)
      .map((v) => String(v ?? '').toLowerCase());
    const col = (nome: string) => cab.indexOf(nome);
    const lojas: { codigo: string; aceitas: number; rejeitadas: number; situacao: string }[] = [];
    for (let n = 2; n <= ws.rowCount; n++) {
      const cel = (nome: string) => {
        const i = col(nome);
        const v = i < 0 ? '' : ws.getRow(n).getCell(i + 1).value;
        return String(v ?? '').trim();
      };
      const codigo = cel('cod_loja');
      const loja = await prisma.loja.findFirst({ where: { geId, codigo, deletedAt: null } });
      if (!loja) continue;
      const registro =
        lojas.find((l) => l.codigo === codigo) ??
        lojas[lojas.push({ codigo, aceitas: 0, rejeitadas: 0, situacao: 'Importada' }) - 1]!;
      const entrada = lerHora(cel('hora_entrada'));
      const saida = lerHora(cel('hora_saida'));
      const dias = lerDias(cel('dias_trabalho'));
      if (entrada === null || saida === null || !dias) {
        registro.rejeitadas++;
        continue;
      }
      const ini = cel('inicio_intervalo') ? lerHora(cel('inicio_intervalo')) : null;
      const fim = cel('fim_intervalo') ? lerHora(cel('fim_intervalo')) : null;
      const carga = Number(cel('carga_horaria').replace(',', '.'));
      const dados = {
        nome: cel('nome_colaborador'),
        lojaId: loja.id,
        funcaoEscala: deduzirFuncao(cel('funcao'), undefined),
        cargaSemanalH:
          Number.isFinite(carga) && carga > 0
            ? Math.round(carga)
            : Math.round(dias.length * (saida - entrada)),
        entrada,
        saida,
        iniIntervalo: ini,
        fimIntervalo: fim,
        dias,
      };
      const matricula = cel('id_colaborador');
      const existente = await prisma.funcionario.findFirst({
        where: { geId, matricula, deletedAt: null },
      });
      if (existente) await prisma.funcionario.update({ where: { id: existente.id }, data: dados });
      else await prisma.funcionario.create({ data: { ...dados, geId, matricula } });
      registro.aceitas++;
    }
    return { status: 201, body: { arquivo: 'escala.xlsx', lojas } };
  };
  return cadeia;
};
