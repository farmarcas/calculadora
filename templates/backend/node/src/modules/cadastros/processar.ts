import { FUNCOES_ESCALA } from '../planilhas/campos.js';

export type FuncaoEscala = (typeof FUNCOES_ESCALA)[number];
import type { Aba } from '../planilhas/leitor.js';
import type { Mapeamento, MapeamentoAba } from '../planilhas/inferencia.js';
import { normalizar } from '../planilhas/normalizar.js';

export type Horario = { abre: string; fecha: string };
export type LojaInput = {
  codigo: string;
  nome: string;
  cnpj?: string;
  uf?: string;
  marca?: string;
  horarios?: { semana?: Horario; sabado?: Horario; domingo?: Horario };
};
export type FuncionarioInput = {
  matricula: string;
  nome: string;
  lojaCodigo: string;
  cpf?: string;
  cargo?: string;
  funcaoEscala: FuncaoEscala | null;
  cargaSemanalH?: number;
  regime?: string;
};
export type ErroLinha = { aba: string; linha: number; motivo: string };
export type Processado = {
  lojas: LojaInput[];
  funcionarios: FuncionarioInput[];
  erros: ErroLinha[];
};

const reHora = /^\d{1,2}:\d{2}$/;

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

const horario = (abre: string, fecha: string): Horario | undefined | 'invalido' => {
  if (!abre && !fecha) return undefined;
  if (!reHora.test(abre) || !reHora.test(fecha)) return 'invalido';
  return { abre: abre.padStart(5, '0'), fecha: fecha.padStart(5, '0') };
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
      const hs: LojaInput['horarios'] = {};
      for (const [dia, a, f] of [
        ['semana', 'abre_semana', 'fecha_semana'],
        ['sabado', 'abre_sabado', 'fecha_sabado'],
        ['domingo', 'abre_domingo', 'fecha_domingo'],
      ] as const) {
        const h = horario(celula(l, mapa.lojas!, a), celula(l, mapa.lojas!, f));
        if (h === 'invalido') return erro(`Horário de ${dia} inválido (use HH:MM)`);
        if (h) hs[dia] = h;
      }
      vistosLoja.add(codigo);
      out.lojas.push({
        codigo,
        nome,
        cnpj: celula(l, mapa.lojas!, 'cnpj') || undefined,
        uf: celula(l, mapa.lojas!, 'uf').toUpperCase() || undefined,
        marca: celula(l, mapa.lojas!, 'marca') || undefined,
        horarios: Object.keys(hs).length ? hs : undefined,
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
      const cargo = celula(l, m, 'cargo') || undefined;
      vistosMat.add(matricula);
      out.funcionarios.push({
        matricula,
        nome,
        lojaCodigo,
        cpf: celula(l, m, 'cpf') || undefined,
        cargo,
        funcaoEscala: deduzirFuncao(celula(l, m, 'funcao_escala') || undefined, cargo),
        cargaSemanalH: carga,
        regime: celula(l, m, 'regime') || undefined,
      });
    });
  }
  return out;
};
