// Regras da equipe (sem React): CPF, máscara, vínculo cargo → função e validação do formulário de funcionário.
export const FUNCOES = ["Farmacêutico", "Atendimento", "Caixa"];
// Cargas mensais que o motor entende (÷ 5 = semanal): 220 = 44h, 210 = 42h, 200 = 40h.
export const CARGAS = [220, 210, 200];
export const DIAS_CURTOS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");

// CPF com dígitos verificadores; recusa sequências repetidas (111.111.111-11).
export const cpfValido = (v) => {
  const d = soDigitos(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dig = (n) => {
    const soma = [...d.slice(0, n)].reduce((s, c, i) => s + Number(c) * (n + 1 - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dig(9) === Number(d[9]) && dig(10) === Number(d[10]);
};
export const formatarCpf = (v) => {
  const d = soDigitos(v);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : v ?? "";
};
// "•••.964.725-••": só o miolo aparece na lista.
export const mascararCpf = (v) => {
  const d = soDigitos(v);
  return d.length === 11 ? `•••.${d.slice(3, 6)}.${d.slice(6, 9)}-••` : v ? "•••" : "—";
};

// Dias como texto: [0..4] → "Seg a sex"; [0..5] → "Seg a sáb"; todos → "Seg a dom"; salteados → "Seg, qua e sex".
export const resumoDeDias = (dias = []) => {
  const d = [...dias].sort((a, b) => a - b);
  if (!d.length) return "—";
  const nome = (i, primeira) => (primeira ? DIAS_CURTOS[i] : DIAS_CURTOS[i].toLowerCase());
  if (d.length > 1 && d.every((x, i) => i === 0 || x === d[i - 1] + 1)) return `${nome(d[0], true)} a ${nome(d[d.length - 1], false)}`;
  if (d.length === 1) return nome(d[0], true);
  return `${d.slice(0, -1).map((x, i) => nome(x, i === 0)).join(", ")} e ${nome(d[d.length - 1], false)}`;
};

// Cargo escolhido no formulário: uma função da escala, ou "outro" (fora do cálculo). Não há texto livre de cargo.
export const OUTRO = "outro";
export const ROTULO_OUTRO = "Outros Cargos (Fora do Cálculo)";
// Cargo que a lista mostra: o do dropdown (função da escala) ou "Outros Cargos (Fora do Cálculo)".
export const cargoDoFuncionario = (f) => (FUNCOES.includes(f.funcaoEscala) ? f.funcaoEscala : ROTULO_OUTRO);
export const funcaoDoSelect = (sel) => (sel === OUTRO || !sel ? null : sel);

export const formularioVazio = () => ({ nome: "", cpf: "", cargoSel: "", cargaMensalH: "220", entrada: "08:00", saida: "17:00", dias: [0, 1, 2, 3, 4], matricula: "", horarioFixo: false });
export const formularioDe = (f) => ({
  nome: f.nome ?? "",
  cpf: f.cpf ? formatarCpf(f.cpf) : "",
  cargoSel: FUNCOES.includes(f.funcaoEscala) ? f.funcaoEscala : OUTRO,
  cargaMensalH: f.cargaMensalH ? String(f.cargaMensalH) : "",
  entrada: f.entrada ?? "",
  saida: f.saida ?? "",
  dias: f.dias ?? [],
  matricula: f.matricula ?? "",
  horarioFixo: f.horarioFixo === true,
});

// Erros em texto, com o campo para focar.
export const errosDoFuncionario = (v) => {
  const e = [];
  if (!v.nome || v.nome.trim().length < 2) e.push({ campo: "nome", texto: "Informe o nome completo." });
  if (v.cpf && !cpfValido(v.cpf)) e.push({ campo: "cpf", texto: "CPF inválido. Confira os números." });
  if (!v.cargoSel) e.push({ campo: "cargo", texto: "Escolha o cargo." });
  if (!!v.entrada !== !!v.saida) e.push({ campo: v.entrada ? "saida" : "entrada", texto: "Informe a entrada e a saída juntas." });
  else if (v.entrada && v.entrada === v.saida) e.push({ campo: "saida", texto: "A saída precisa ser diferente da entrada." });
  return e;
};

// Formulário → corpo da API. Matrícula nova é gerada (a tela não pede); ao editar, o horário em branco limpa.
export const funcionarioParaApi = (v, lojaId, novo) => {
  const b = {
    matricula: v.matricula || `EQ-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase(),
    nome: v.nome.trim(),
    lojaId,
    funcaoEscala: funcaoDoSelect(v.cargoSel),
    cargo: v.cargoSel === OUTRO ? ROTULO_OUTRO : v.cargoSel,
    dias: v.dias,
    horarioFixo: v.horarioFixo === true,
  };
  if (v.cpf) b.cpf = v.cpf;
  if (v.cargaMensalH) b.cargaMensalH = Number(v.cargaMensalH);
  if (v.entrada || v.saida || !novo) {
    b.entrada = v.entrada || null;
    b.saida = v.saida || null;
  }
  return b;
};
