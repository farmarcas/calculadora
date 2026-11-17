// Núcleo da migração das escalas já importadas para o Cadastro (spec 026), puro e sem banco.
// Regra: para cada turno da escala importada, achar o funcionário da mesma loja e matrícula e preencher SÓ o que está vazio.
// Nunca cria funcionário, nunca sobrescreve e pode rodar de novo sem mudar nada.

export type TurnoEscala = {
  matricula: string;
  nome: string;
  funcao: string | null;
  dias: number[];
  entrada: number;
  saida: number;
  iniIntervalo: number | null;
  fimIntervalo: number | null;
  cargaH: number;
};

export type FuncionarioCadastro = {
  id: string;
  matricula: string;
  nome: string;
  funcaoEscala: string | null;
  cargaSemanalH: number | null;
  entrada: number | null;
  saida: number | null;
  iniIntervalo: number | null;
  fimIntervalo: number | null;
  dias: number[];
};

export type Preenchimento = {
  funcionarioId: string;
  matricula: string;
  dados: Partial<{
    funcaoEscala: string;
    cargaSemanalH: number;
    entrada: number;
    saida: number;
    iniIntervalo: number;
    fimIntervalo: number;
    dias: number[];
  }>;
};

// Pessoa da escala sem funcionário no Cadastro: o que seria criado se a pessoa responsável pedir (`--criar-ausentes`).
export type Criacao = {
  matricula: string;
  nome: string;
  funcaoEscala: string | null;
  cargaSemanalH: number | null;
  entrada: number;
  saida: number;
  iniIntervalo: number | null;
  fimIntervalo: number | null;
  dias: number[];
};

export type RelatorioLoja = {
  preenchidos: number;
  jaTinhamDados: number;
  semCorrespondente: { matricula: string; nome: string }[];
};

const chave = (m: string) => m.trim().toLowerCase();

export const planejarMigracao = (
  turnos: TurnoEscala[],
  funcionarios: FuncionarioCadastro[],
): { preenchimentos: Preenchimento[]; criacoes: Criacao[]; relatorio: RelatorioLoja } => {
  const porMatricula = new Map(funcionarios.map((f) => [chave(f.matricula), f]));
  const preenchimentos: Preenchimento[] = [];
  const criacoes: Criacao[] = [];
  const relatorio: RelatorioLoja = { preenchidos: 0, jaTinhamDados: 0, semCorrespondente: [] };
  const vistos = new Set<string>();
  for (const t of turnos) {
    const k = chave(t.matricula);
    if (vistos.has(k)) continue; // matrícula repetida na escala: vale a primeira linha
    vistos.add(k);
    const f = porMatricula.get(k);
    if (!f) {
      relatorio.semCorrespondente.push({ matricula: t.matricula, nome: t.nome });
      criacoes.push({
        matricula: t.matricula.trim(),
        nome: t.nome,
        funcaoEscala: t.funcao,
        cargaSemanalH: t.cargaH > 0 ? Math.round(t.cargaH) : null,
        entrada: t.entrada,
        saida: t.saida,
        iniIntervalo:
          t.iniIntervalo !== null && t.fimIntervalo !== null && t.fimIntervalo > t.iniIntervalo
            ? t.iniIntervalo
            : null,
        fimIntervalo:
          t.iniIntervalo !== null && t.fimIntervalo !== null && t.fimIntervalo > t.iniIntervalo
            ? t.fimIntervalo
            : null,
        dias: [...t.dias].sort(),
      });
      continue;
    }
    const dados: Preenchimento['dados'] = {};
    if (f.dias.length === 0 && t.dias.length > 0) dados.dias = [...t.dias].sort();
    const semHorario = f.entrada === null && f.saida === null;
    if (semHorario) {
      dados.entrada = t.entrada;
      dados.saida = t.saida;
    }
    const entrada = dados.entrada ?? f.entrada;
    const saida = dados.saida ?? f.saida;
    const semIntervalo = f.iniIntervalo === null && f.fimIntervalo === null;
    if (
      semIntervalo &&
      t.iniIntervalo !== null &&
      t.fimIntervalo !== null &&
      entrada !== null &&
      saida !== null &&
      t.fimIntervalo > t.iniIntervalo &&
      t.iniIntervalo >= entrada - 1e-9 &&
      t.fimIntervalo <= saida + 1e-9
    ) {
      dados.iniIntervalo = t.iniIntervalo;
      dados.fimIntervalo = t.fimIntervalo;
    }
    if (f.funcaoEscala === null && t.funcao) dados.funcaoEscala = t.funcao;
    if (f.cargaSemanalH === null && t.cargaH > 0) dados.cargaSemanalH = Math.round(t.cargaH);
    if (Object.keys(dados).length === 0) relatorio.jaTinhamDados++;
    else {
      relatorio.preenchidos++;
      preenchimentos.push({ funcionarioId: f.id, matricula: f.matricula, dados });
    }
  }
  return { preenchimentos, criacoes, relatorio };
};
