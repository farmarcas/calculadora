import { FUNCOES_ESCALA } from '../planilhas/campos.js';
import {
  DIA_24H,
  DIA_FECHADO,
  semana24h,
  validarHorarios,
  type DiaHorario,
  type HorariosSemana,
} from './horarios.js';

export type FuncaoEscala = (typeof FUNCOES_ESCALA)[number];
import type { Aba } from '../planilhas/leitor.js';
import type { Mapeamento, MapeamentoAba } from '../planilhas/inferencia.js';
import { lerDias, lerHora } from '../escala/interpretar.js';
import { normalizar } from '../planilhas/normalizar.js';
import { decimalParaHora, semanalDeMensal } from './carga.js';
import { faturamentoDaLinha, type Faturamento } from './faturamento.js';
import { configuracaoDaLinha, lerSimNao, type ConfiguracaoLinha } from './configuracao.js';

// Aceita "Simples Nacional", "Lucro Presumido", "Lucro Real" (e variações); qualquer outra coisa fica em branco.
export const interpretarRegime = (texto: string) => {
  const t = normalizar(texto);
  if (t.includes('simples')) return 'simples' as const;
  if (t.includes('presumido')) return 'presumido' as const;
  if (t.includes('real')) return 'real' as const;
  return undefined;
};

export type Horario = { abre: string; fecha: string };
export type LojaInput = {
  codigo: string;
  nome: string;
  cnpj?: string;
  cidade?: string;
  uf?: string;
  marca?: string;
  regimeTributario?: 'simples' | 'presumido' | 'real';
  faturamento?: Faturamento;
  horarios?: HorariosSemana;
  // Convenção, metas e custos (a gravação decide o que o perfil de quem importa pode gravar).
  configuracao?: ConfiguracaoLinha;
};
export type FuncionarioInput = {
  matricula: string;
  nome: string;
  lojaCodigo: string;
  cpf?: string;
  cargo?: string;
  funcaoEscala: FuncaoEscala | null;
  cargaSemanalH?: number;
  cargaMensalH?: number;
  entrada?: string;
  saida?: string;
  dias?: number[];
  regime?: string;
  horarioFixo?: boolean;
};
export type ErroLinha = { aba: string; linha: number; motivo: string };
export type Processado = {
  lojas: LojaInput[];
  funcionarios: FuncionarioInput[];
  erros: ErroLinha[];
};

export const deduzirFuncao = (
  funcaoEscala: string | undefined,
  cargo: string | undefined,
): FuncaoEscala | null => {
  const direta = normalizar(funcaoEscala ?? '');
  if (direta) {
    const achada = FUNCOES_ESCALA.find((f) => normalizar(f) === direta);
    if (achada) return achada;
  }
  const t = normalizar(`${funcaoEscala ?? ''} ${cargo ?? ''}`);
  if (/farmac/.test(t)) return 'Farmacêutico';
  if (/caixa/.test(t)) return 'Caixa';
  if (/perfum|dermo/.test(t)) return 'Perfumaria';
  if (/balconist|atend|vendedor/.test(t)) return 'Atendimento';
  if (/apoio|auxiliar|estoq|repositor|limpez|entregador/.test(t)) return 'Apoio';
  return null;
};

const celula = (linha: string[], m: MapeamentoAba, campo: string): string => {
  const i = m.colunas[campo];
  return i == null ? '' : (linha[i] ?? '').trim();
};

const CHAVES_DIA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const NOMES_DIA = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
const MARCA_FECHADA = /^(fechad[oa]|nao|não|x|-|folga|sem expediente)$/i;
const MARCA_24H = /^24\s?h(oras?|s)?$/i;
const SIM = /^(sim|s|x|true|1|yes)$/i;

const horaTxt = (t: string): string | null => {
  const m = /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h > 24 || min > 59 || (h === 24 && min > 0)) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

// Horário da loja numa linha da planilha. Sem nenhuma informação de horário: devolve vazio (não mexe no que a loja já tem).
// Dia sem horário ou "Fechada" = fechado; "24h" = aberto 24 horas; "Loja 24h = Sim" vale para os sete dias.
export const interpretarHorarioLoja = (
  cel: (chave: string) => string,
): { horarios?: HorariosSemana; erro?: string } => {
  if (SIM.test(cel('loja_24h').trim())) return { horarios: semana24h() };
  const dias: DiaHorario[] = [];
  let algum = false;
  for (let i = 0; i < 7; i++) {
    const k = CHAVES_DIA[i]!;
    let abre = cel(`abre_${k}`).trim();
    let fecha = cel(`fecha_${k}`).trim();
    // Planilhas antigas: uma abertura e um fechamento valem de segunda a sexta (a coluna do dia, se houver, manda).
    if (i < 5) {
      if (!abre) abre = cel('abre_semana').trim();
      if (!fecha) fecha = cel('fecha_semana').trim();
    }
    if (!abre && !fecha) {
      dias.push({ ...DIA_FECHADO });
      continue;
    }
    algum = true;
    if (MARCA_24H.test(abre) || MARCA_24H.test(fecha)) dias.push({ ...DIA_24H });
    else if (MARCA_FECHADA.test(abre) || MARCA_FECHADA.test(fecha)) dias.push({ ...DIA_FECHADO });
    else {
      const a = horaTxt(abre);
      let f = horaTxt(fecha);
      // "Fecha 00:00" costuma querer dizer meia-noite.
      if (a && f === '00:00' && a !== '00:00') f = '24:00';
      if (!a || !f)
        return {
          erro: `Horário de ${NOMES_DIA[i]} inválido: informe abertura e fechamento (HH:MM), "Fechada" ou "24h"`,
        };
      dias.push({ aberta: true, abre: a, fecha: f });
    }
  }
  if (!algum) return {};
  const horarios: HorariosSemana = { versao: 2, dias };
  const erros = validarHorarios(horarios);
  return erros.length ? { erro: erros[0]! } : { horarios };
};

export const processarLinhas = (abas: Aba[], mapa: Mapeamento): Processado => {
  const out: Processado = { lojas: [], funcionarios: [], erros: [] };
  const vistosLoja = new Set<string>();
  const vistosMat = new Set<string>();

  const lojaAba = mapa.lojas && abas.find((a) => a.nome === mapa.lojas!.aba);
  if (mapa.lojas && lojaAba) {
    lojaAba.linhas.forEach((l, idx) => {
      const n = idx + 2;
      const codigo = celula(l, mapa.lojas!, 'codigo');
      const nome = celula(l, mapa.lojas!, 'nome');
      if (!codigo && !nome) return;
      const erro = (motivo: string) => out.erros.push({ aba: lojaAba.nome, linha: n, motivo });
      if (!codigo) return erro('Código da loja vazio');
      if (!nome) return erro('Nome da loja vazio');
      if (vistosLoja.has(codigo)) return erro(`Código ${codigo} repetido na planilha`);
      const h = interpretarHorarioLoja((chave) => celula(l, mapa.lojas!, chave));
      if (h.erro) return erro(h.erro);
      const fat = faturamentoDaLinha((chave) => celula(l, mapa.lojas!, chave));
      if (fat.erro) return erro(fat.erro);
      const conf = configuracaoDaLinha((chave) => celula(l, mapa.lojas!, chave));
      if (conf.erro) return erro(conf.erro);
      vistosLoja.add(codigo);
      out.lojas.push({
        codigo,
        nome,
        cnpj: celula(l, mapa.lojas!, 'cnpj') || undefined,
        cidade: celula(l, mapa.lojas!, 'cidade') || undefined,
        uf: celula(l, mapa.lojas!, 'uf').toUpperCase() || undefined,
        marca: celula(l, mapa.lojas!, 'marca') || undefined,
        regimeTributario: interpretarRegime(celula(l, mapa.lojas!, 'regime_tributario')),
        faturamento: fat.faturamento,
        horarios: h.horarios,
        configuracao: conf.configuracao,
      });
    });
  }

  const funcAba = mapa.funcionarios && abas.find((a) => a.nome === mapa.funcionarios!.aba);
  if (mapa.funcionarios && funcAba) {
    funcAba.linhas.forEach((l, idx) => {
      const n = idx + 2;
      const m = mapa.funcionarios!;
      const matricula = celula(l, m, 'matricula');
      const nome = celula(l, m, 'nome');
      const lojaCodigo = celula(l, m, 'loja');
      if (!matricula && !nome && !lojaCodigo) return;
      const erro = (motivo: string) => out.erros.push({ aba: funcAba.nome, linha: n, motivo });
      if (!matricula) return erro('Matrícula vazia');
      if (!nome) return erro('Nome vazio');
      if (!lojaCodigo) return erro('Loja de lotação vazia');
      if (vistosMat.has(matricula)) return erro(`Matrícula ${matricula} repetida na planilha`);
      const cargaTxt = celula(l, m, 'carga_semanal').replace(',', '.');
      const carga = cargaTxt ? Math.round(Number(cargaTxt)) : undefined;
      if (cargaTxt && (!Number.isFinite(carga) || carga! <= 0 || carga! > 60))
        return erro('Carga semanal inválida');
      const mensalTxt = celula(l, m, 'carga_mensal').replace(',', '.');
      const mensal = mensalTxt ? Math.round(Number(mensalTxt)) : undefined;
      if (mensalTxt && (!Number.isFinite(mensal) || mensal! <= 0 || mensal! > 260))
        return erro('Carga mensal inválida');
      const entradaTxt = celula(l, m, 'entrada');
      const saidaTxt = celula(l, m, 'saida');
      const entrada = entradaTxt ? lerHora(entradaTxt) : null;
      const saida = saidaTxt ? lerHora(saidaTxt) : null;
      if ((entradaTxt && entrada === null) || (saidaTxt && saida === null))
        return erro('Horário de entrada ou saída inválido');
      if ((entrada === null) !== (saida === null))
        return erro('Informe a entrada e a saída (ou deixe as duas em branco)');
      if (entrada !== null && entrada === saida)
        return erro('A saída deve ser diferente da entrada');
      const diasTxt = celula(l, m, 'dias');
      const dias = diasTxt ? lerDias(diasTxt) : null;
      if (diasTxt && !dias) return erro('Dias trabalhados inválidos');
      const fixo = lerSimNao(celula(l, m, 'horario_fixo'));
      if (Number.isNaN(fixo)) return erro('Horário fixo: use Sim ou Não');
      const cargo = celula(l, m, 'cargo') || undefined;
      vistosMat.add(matricula);
      out.funcionarios.push({
        matricula,
        nome,
        lojaCodigo,
        cpf: celula(l, m, 'cpf') || undefined,
        cargo,
        funcaoEscala: deduzirFuncao(celula(l, m, 'funcao_escala') || undefined, cargo),
        cargaSemanalH: carga ?? (mensal ? semanalDeMensal(mensal) : undefined),
        cargaMensalH: mensal,
        entrada: entrada === null ? undefined : decimalParaHora(entrada),
        saida: saida === null ? undefined : decimalParaHora(saida!),
        dias: dias ?? undefined,
        regime: celula(l, m, 'regime') || undefined,
        horarioFixo: fixo === null ? undefined : (fixo as boolean),
      });
    });
  }
  return out;
};
