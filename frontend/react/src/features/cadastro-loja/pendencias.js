// "O que falta preencher" sobre o que a pessoa está digitando (sem React): a MESMA regra do servidor (situacao.ts), refeita
// sobre o rascunho para o destaque sumir assim que o campo fica válido, antes de salvar. Os textos e a ordem são os do servidor.
// Onde a tela não tem o dado (aba ainda não aberta, faturamento e salários de quem não é dono), vale a lista do servidor.
import { cuidaDoGrupo, editaLoja } from "../../api/perfis.js";
import { NOMES_DIA, TOLERANCIA_MENSAL, faturamentoDaSemana, horasDoDia, mensalDosDias } from "./calculos.js";

const DIAS_DE = NOMES_DIA.map((d) => d.toLowerCase());
const lista = (xs) => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}`);
const preenchido = (v) => String(v ?? "").trim() !== "";

const CAMPOS_DA_LOJA = [["nome", "nome", "nome"], ["cidade", "cidade", "cidade"], ["uf", "UF", "uf"], ["regimeTributario", "regime tributário", "regime"]];

// Os mesmos textos do servidor, para a pendência que aparece depois de apagar um campo.
const modelo = {
  dados: (faltam) => ({ id: "dados", aba: "dados", titulo: "Dados da loja", texto: `Falta: ${lista(faltam.map((f) => f[1]))}.`, porque: "Esses dados identificam a loja e definem os encargos.", campos: faltam.map((f) => f[2]), soDono: false }),
  funcionamento: () => ({ id: "funcionamento", aba: "dados", titulo: "Horário de funcionamento", texto: "Informe quando a loja abre e fecha em pelo menos um dia.", porque: "Sem o horário de funcionamento não dá para calcular a escala.", campos: ["dia-0"], soDono: false }),
  farmaceutico: () => ({ id: "farmaceutico", aba: "equipe", titulo: "Farmacêutico na equipe", texto: "Cadastre pelo menos um farmacêutico.", porque: "A lei exige farmacêutico em todo o horário de funcionamento.", campos: [], soDono: false }),
  faturamentoDia: (dias, nenhum) => ({
    id: "faturamentoDia", aba: "dados", titulo: "Faturamento por dia", soDono: true,
    texto: nenhum ? "Informe o faturamento de cada dia aberto." : `${dias.length === 1 ? "Falta 1 dia aberto" : `Faltam ${dias.length} dias abertos`}: ${lista(dias.map((i) => DIAS_DE[i]))}.`,
    porque: "Sem o faturamento por dia não dá para estimar o impacto dos cenários.", campos: dias.map((i) => `fat-${i}`),
  }),
  faturamentoMes: () => ({ id: "faturamentoMes", aba: "dados", titulo: "Faturamento do mês", texto: "O valor do mês é diferente da soma dos dias. Confira.", porque: "Confira o faturamento do mês: o valor informado é diferente da soma dos dias em mais de 10%.", campos: ["mensal"], soDono: true, alerta: true }),
  margem: () => ({ id: "margem", aba: "dados", titulo: "Margem bruta média", texto: "Informe a margem bruta em %.", porque: "Sem a margem, o impacto dos cenários fica em branco.", campos: ["margem"], soDono: true }),
  salario: (f) => ({ id: `salario:${f}`, aba: "regras", titulo: `Salário médio · ${f}`, texto: "Informe o salário médio sem premiação.", porque: "Sem o salário, não dá para calcular o custo de contratar.", campos: [`salario-${f}`], soDono: true }),
};

// Quem pode preencher cada item: o dono, tudo; operador e gestor, o que não depende de faturamento, margem ou salário; consulta, nada.
export const podePreencher = (item, perfil) => {
  if (item.soDono) return perfil === "TENANT_ADMIN";
  return item.aba === "equipe" ? cuidaDoGrupo(perfil) : editaLoja(perfil);
};

// servidor: situacao.pendencias do painel. loja e custos: o rascunho (ausentes enquanto a aba não abriu).
// equipe: { farmaceuticos, funcoesNaEquipe } do painel. Devolve cada item com `feito`, o total e quanto cada aba ainda pede.
export const pendenciasDoRascunho = ({ servidor = [], loja, custos, equipe = { farmaceuticos: 0, funcoesNaEquipe: [] }, dono = false, perfil = "" }) => {
  const doServidor = (id) => servidor.find((p) => p.id === id) ?? null;
  const abertos = loja?.horarios ? loja.horarios.dias.map((d, i) => (horasDoDia(d) > 0 ? i : -1)).filter((i) => i >= 0) : null;
  const itens = []; // { item | null, aplica }

  // dados
  const faltam = loja ? CAMPOS_DA_LOJA.filter(([k]) => !preenchido(loja[k])) : null;
  itens.push({ id: "dados", pendente: faltam ? (faltam.length ? modelo.dados(faltam) : null) : doServidor("dados"), aplica: true });
  // funcionamento
  itens.push({ id: "funcionamento", pendente: abertos ? (abertos.length ? null : modelo.funcionamento()) : doServidor("funcionamento"), aplica: true });
  // farmacêutico
  itens.push({ id: "farmaceutico", pendente: equipe.farmaceuticos < 1 ? modelo.farmaceutico() : null, aplica: true });

  // faturamento por dia, do mês e margem: só o dono tem o dado na tela
  const fat = dono && loja?.faturamento && abertos ? loja.faturamento : null;
  const semFat = fat ? abertos.filter((i) => !preenchido(fat.dias[i])) : null;
  itens.push({
    id: "faturamentoDia",
    pendente: semFat ? (semFat.length ? modelo.faturamentoDia(semFat, semFat.length === abertos.length && !fat.dias.some(preenchido)) : null) : doServidor("faturamentoDia"),
    aplica: true,
  });
  let mes = doServidor("faturamentoMes");
  if (fat) {
    const calculado = mensalDosDias(faturamentoDaSemana(loja.horarios, fat.dias));
    const informado = Number(fat.mensal);
    mes = !semFat.length && preenchido(fat.mensal) && informado > 0 && calculado > 0 && Math.abs(informado - calculado) / calculado > TOLERANCIA_MENSAL ? modelo.faturamentoMes() : null;
  }
  itens.push({ id: "faturamentoMes", pendente: mes, aplica: !!(mes || doServidor("faturamentoMes")) });
  itens.push({ id: "margem", pendente: fat ? (Number(fat.margemPct) > 0 ? null : modelo.margem()) : doServidor("margem"), aplica: true });

  // salário médio: o Farmacêutico sempre; as demais funções só com gente na equipe
  const precisam = ["Farmacêutico", ...equipe.funcoesNaEquipe.filter((f) => f !== "Farmacêutico")];
  for (const f of precisam) {
    const sal = dono && custos?.salarioMedio ? custos.salarioMedio[f] : undefined;
    const pendente = dono && custos?.salarioMedio ? (Number(sal) > 0 ? null : modelo.salario(f)) : doServidor(`salario:${f}`);
    itens.push({ id: `salario:${f}`, pendente, aplica: true });
  }

  const todos = itens
    .filter((x) => x.aplica)
    .map((x) => {
      const base = x.pendente ?? doServidor(x.id) ?? modeloDoId(x.id);
      return { ...base, feito: !x.pendente };
    });
  const abertosAgora = todos.filter((x) => !x.feito);
  const meus = abertosAgora.filter((x) => podePreencher(x, perfil));
  const porAba = { dados: 0, equipe: 0, regras: 0 };
  for (const x of meus) porAba[x.aba] += 1;
  return {
    itens: todos,
    total: todos.length,
    feitos: todos.length - abertosAgora.length,
    abertos: abertosAgora.length,
    voceResolve: meus.length,
    soDono: abertosAgora.length - meus.length,
    porAba,
  };
};

// Texto de um item que já foi resolvido (para aparecer riscado como "Feito").
function modeloDoId(id) {
  if (id.startsWith("salario:")) return modelo.salario(id.slice(8));
  const f = { dados: () => modelo.dados(CAMPOS_DA_LOJA), funcionamento: modelo.funcionamento, farmaceutico: modelo.farmaceutico, faturamentoDia: () => modelo.faturamentoDia([], true), faturamentoMes: modelo.faturamentoMes, margem: modelo.margem }[id];
  return f();
}
