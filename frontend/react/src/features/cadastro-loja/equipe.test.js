import { describe, expect, it } from "vitest";
import { cpfValido, errosDoFuncionario, formularioVazio, funcionarioParaApi, mascararCpf, resumoDeDias } from "./equipe.js";

describe("CPF", () => {
  it("valida os dígitos verificadores", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224725")).toBe(true);
    expect(cpfValido("529.982.247-24")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cpfValido("123")).toBe(false);
  });
  it("mascara: só o miolo aparece", () => {
    expect(mascararCpf("52998224725")).toBe("•••.982.247-••");
    expect(mascararCpf("")).toBe("—");
  });
});

describe("dias da semana em texto", () => {
  it("sequência vira 'Seg a sex'; salteado lista; todos 'Seg a dom'", () => {
    expect(resumoDeDias([0, 1, 2, 3, 4])).toBe("Seg a sex");
    expect(resumoDeDias([0, 1, 2, 3, 4, 5])).toBe("Seg a sáb");
    expect(resumoDeDias([0, 1, 2, 3, 4, 5, 6])).toBe("Seg a dom");
    expect(resumoDeDias([0, 2, 4])).toBe("Seg, qua e sex");
    expect(resumoDeDias([6])).toBe("Dom");
    expect(resumoDeDias([])).toBe("—");
  });
});

describe("formulário de funcionário", () => {
  const ok = { ...formularioVazio(), nome: "Ana Souza", cargoSel: "Farmacêutico" };
  it("válido: nome, cargo e horário coerente", () => {
    expect(errosDoFuncionario(ok)).toEqual([]);
  });
  it("erros em texto: nome curto, CPF inválido, cargo vazio, 'outro' sem nome, saída igual à entrada, horário pela metade", () => {
    const campos = (v) => errosDoFuncionario(v).map((e) => e.campo);
    expect(campos({ ...ok, nome: "A" })).toContain("nome");
    expect(campos({ ...ok, cpf: "111.111.111-11" })).toContain("cpf");
    expect(campos({ ...ok, cargoSel: "" })).toContain("cargo");
    expect(campos({ ...ok, cargoSel: "outro", cargoTexto: " " })).toContain("cargoTexto");
    expect(campos({ ...ok, entrada: "08:00", saida: "08:00" })).toContain("saida");
    expect(campos({ ...ok, entrada: "08:00", saida: "" })).toContain("saida");
    expect(campos({ ...ok, entrada: "", saida: "" })).toEqual([]);
  });
  it("corpo da API: função vira funcaoEscala; 'outro' fica fora do cálculo; matrícula é gerada", () => {
    const farma = funcionarioParaApi(ok, "L1", true);
    expect(farma).toMatchObject({ nome: "Ana Souza", lojaId: "L1", funcaoEscala: "Farmacêutico", cargo: "Farmacêutico", cargaMensalH: 220, dias: [0, 1, 2, 3, 4] });
    expect(farma.matricula).toMatch(/^EQ-/);
    const outro = funcionarioParaApi({ ...ok, cargoSel: "outro", cargoTexto: "Gerente" }, "L1", true);
    expect(outro).toMatchObject({ funcaoEscala: null, cargo: "Gerente" });
    // ao editar, horário em branco limpa (null); ao criar, em branco nem vai
    expect(funcionarioParaApi({ ...ok, entrada: "", saida: "", matricula: "M1" }, "L1", false)).toMatchObject({ matricula: "M1", entrada: null, saida: null });
    expect(funcionarioParaApi({ ...ok, entrada: "", saida: "" }, "L1", true)).not.toHaveProperty("entrada");
  });
});
