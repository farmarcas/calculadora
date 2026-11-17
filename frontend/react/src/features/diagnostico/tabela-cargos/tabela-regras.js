// Regras da tabela por cargo do card "Diagnóstico da escala" (spec 058). Sem cálculo novo: só soma e organiza o que o servidor
// já devolve por regra e por cargo (pessoas, capacidade, necessidade, falta e a sugestão de contratação).
import { ehDesejavel } from "../cartao/linha-regras.js";
import { horas, saldoTxt } from "../cardDiagnostico.js";

const arred = (n) => Math.round(n * 100) / 100;
export const ORDEM = ["Farmacêutico", "Atendimento", "Caixa"];

const horasContratadas = (f) => (f.contratar > 0 ? f.sugestao?.horasContratadas ?? 0 : 0);

// Farmacêutico é sempre obrigatório; os outros cargos só são "desejáveis" quando a sugestão traz gente para manter o nível de hoje.
export const statusDoCargo = (f) => {
  if (f.funcao === "Farmacêutico") return "obrigatorio";
  return f.contratar > 0 && ehDesejavel(f.funcao) ? "desejavel" : "sem_falta";
};

// Uma linha por cargo existente na loja (tem gente, falta ou contratação), na ordem de sempre, com "hoje" e "com a sugestão".
export const linhasPorCargo = (regra) => {
  const lista = (regra?.funcoes ?? []).filter((f) => f.funcao === "Farmacêutico" || f.pessoas > 0 || f.contratar > 0 || f.gapH > 0);
  const pos = (n) => (ORDEM.indexOf(n) === -1 ? ORDEM.length : ORDEM.indexOf(n));
  return [...lista]
    .sort((a, b) => pos(a.funcao) - pos(b.funcao))
    .map((f) => {
      const ganho = horasContratadas(f);
      const faltaDepois = f.contratar > 0 ? arred(Math.max(0, f.gapH - ganho)) : f.gapH;
      return {
        funcao: f.funcao,
        status: statusDoCargo(f),
        pessoas: { hoje: f.pessoas, depois: f.pessoas + f.contratar },
        horas: { hoje: arred(f.capacidadeH), depois: arred(f.capacidadeH + ganho) },
        falta: { hoje: f.gapH, depois: faltaDepois },
        turnosAcobrir: f.funcao === "Farmacêutico" ? Math.max(0, -f.saldoT) : 0,
        sobraH: f.gapH <= 0 && f.saldoH > 0 && f.funcao !== "Farmacêutico" ? arred(f.saldoH) : 0,
      };
    });
};

// A linha "Equipe toda": pessoas, horas por semana e a folga (capacidade menos necessidade) hoje → com a sugestão.
export const equipeToda = (regra, linhas) => {
  const soma = (pega) => linhas.reduce((s, l) => s + pega(l), 0);
  const ganho = (regra?.funcoes ?? []).reduce((s, f) => s + horasContratadas(f), 0);
  const folgaHoje = arred(regra?.resumo?.saldoHoras ?? 0);
  return {
    pessoas: { hoje: soma((l) => l.pessoas.hoje), depois: soma((l) => l.pessoas.depois) },
    horas: { hoje: arred(soma((l) => l.horas.hoje)), depois: arred(soma((l) => l.horas.depois)) },
    folga: { hoje: folgaHoje, depois: arred(folgaHoje + ganho) },
  };
};

export const seta = (a, b) => `${a} → ${b}`;
export const textoHoras = (p) => seta(horas(p.hoje), horas(p.depois));
export const textoFolga = (p) => seta(saldoTxt(p.hoje), saldoTxt(p.depois));
