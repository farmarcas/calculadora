// Regras da "Escala da semana" (spec 041), puras e sem React: monta a semana de cada pessoa a partir do que a Escala por hora
// já usa (quadro, turnos e dias abertos). Nenhuma conta nova: horas, dias e intervalo vêm de escala-regras.js.
import { NOMES_DIA, textoDoIntervalo, textoDoTurno, totalDaSemana } from "./escala-regras.js";

export const ORDEM_DAS_FUNCOES = ["Farmacêutico", "Atendimento", "Caixa"];
export const DIAS_DA_SEMANA = NOMES_DIA;

// Uma célula: "turno" (com horário e intervalo), "folga" (dia aberto sem turno) ou "fechada" (a loja não abre).
export const celulaDoDia = (turnos, matricula, dia, abertos) => {
  if (!abertos.has(dia)) return { estado: "fechada", dia };
  const t = turnos.find((x) => x.matricula === matricula && x.dia === dia);
  if (!t) return { estado: "folga", dia };
  return { estado: "turno", dia, texto: textoDoTurno(t), intervalo: textoDoIntervalo(t) };
};

// O total estoura a jornada quando a pessoa tem carga contratada e as horas da semana passam dela.
export const passaDaJornada = (horas, cargaH) => cargaH > 0 && horas > cargaH + 1e-9;

// Sem nenhum turno na simulação não há semana para mostrar.
export const semEscala = (turnos = []) => turnos.length === 0;

// Os grupos por função, cada um com as pessoas e (no fim) as Contratações simuladas, uma linha por pessoa.
export const montarSemana = ({ quadro = [], turnos = [], diasAbertos = [] }) => {
  const abertos = new Set(diasAbertos.map((d) => d.dia));
  const ativos = quadro.filter((p) => !p.desligado && p.funcao);
  const funcoes = [...new Set(ativos.map((p) => p.funcao))].sort((a, b) => (ORDEM_DAS_FUNCOES.indexOf(a) + 1 || 99) - (ORDEM_DAS_FUNCOES.indexOf(b) + 1 || 99));
  const linhaDe = (p) => {
    const meus = turnos.filter((t) => t.matricula === p.matricula);
    const total = totalDaSemana(turnos, p.matricula);
    return {
      matricula: p.matricula,
      nome: p.nome,
      funcao: p.funcao,
      cargaH: p.cargaH,
      simulada: !!p.vaga,
      celulas: NOMES_DIA.map((_, dia) => celulaDoDia(meus, p.matricula, dia, abertos)),
      total: { horas: total.horas, dias: total.dias, texto: total.dias ? total.texto : "0h · 0 dias" },
      passaDaJornada: passaDaJornada(total.horas, p.cargaH),
    };
  };
  return funcoes.map((funcao) => {
    const doGrupo = ativos.filter((p) => p.funcao === funcao);
    const linhas = [...doGrupo.filter((p) => !p.vaga), ...doGrupo.filter((p) => p.vaga)].map(linhaDe);
    return { funcao, pessoas: doGrupo.filter((p) => !p.vaga).length + doGrupo.filter((p) => p.vaga).length, linhas };
  });
};
