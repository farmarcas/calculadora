import { beforeEach, describe, expect, it, vi } from "vitest";

const api = { init: vi.fn(() => Promise.resolve()), destroy: vi.fn(() => Promise.resolve()) };
vi.mock("@usersnap/browser", () => ({ loadSpace: vi.fn(() => Promise.resolve(api)) }));
import { loadSpace } from "@usersnap/browser";
import { identificar, iniciar, limpar } from "./servico.js";

const PESSOA = { id: 7, nome: "Ana", email: "ana@x.com", perfil: "TENANT_ADMIN", papel_radar: "tenant_admin", loja: "Loja Centro" };
const esperar = () => new Promise((r) => setTimeout(r, 0));
const ligar = (extra = {}) => iniciar({ chave: "chave-teste", ...extra });

beforeEach(() => {
  vi.clearAllMocks();
  loadSpace.mockImplementation(() => Promise.resolve(api));
  api.init.mockImplementation(() => Promise.resolve());
  api.destroy.mockImplementation(() => Promise.resolve());
});

describe("sem chave", () => {
  it("fica desligado e não carrega nada", async () => {
    iniciar({ chave: "" });
    identificar(PESSOA);
    limpar();
    await esperar();
    expect(loadSpace).not.toHaveBeenCalled();
    expect(api.init).not.toHaveBeenCalled();
  });
});

describe("com chave", () => {
  it("não carrega nada antes de identificar", async () => {
    ligar();
    await esperar();
    expect(loadSpace).not.toHaveBeenCalled();
  });

  it("carrega com a chave e monta com a pessoa e a loja, sem dado extra", async () => {
    ligar();
    identificar({ ...PESSOA, cnpj: "123", faturamento: 1000 });
    await esperar();
    expect(loadSpace).toHaveBeenCalledWith("chave-teste");
    expect(api.init).toHaveBeenCalledWith({
      user: { userId: "7", email: "ana@x.com", nome: "Ana", perfil: "TENANT_ADMIN", papel_radar: "tenant_admin" },
      custom: { loja: "Loja Centro" },
    });
  });

  it("sem id não identifica", async () => {
    ligar();
    identificar({ nome: "Ana", email: "a@x.com" });
    await esperar();
    expect(loadSpace).not.toHaveBeenCalled();
  });

  it("repetir os mesmos dados não refaz nada", async () => {
    ligar();
    identificar(PESSOA);
    identificar(PESSOA);
    await esperar();
    expect(loadSpace).toHaveBeenCalledTimes(1);
    expect(api.init).toHaveBeenCalledTimes(1);
  });

  it("troca de loja desmonta e monta de novo, sem recarregar o pacote", async () => {
    ligar();
    identificar(PESSOA);
    await esperar();
    identificar({ ...PESSOA, loja: "Loja Norte" });
    await esperar();
    expect(api.destroy).toHaveBeenCalledTimes(1);
    expect(api.init).toHaveBeenCalledTimes(2);
    expect(api.init).toHaveBeenLastCalledWith(expect.objectContaining({ custom: { loja: "Loja Norte" } }));
    expect(loadSpace).toHaveBeenCalledTimes(1);
  });

  it("mudanças em sequência rápida terminam com o último estado", async () => {
    ligar();
    identificar(PESSOA);
    identificar({ ...PESSOA, loja: "B" });
    identificar({ ...PESSOA, loja: "C" });
    await esperar();
    await esperar();
    expect(api.init).toHaveBeenLastCalledWith(expect.objectContaining({ custom: { loja: "C" } }));
  });

  it("limpar desmonta e a próxima pessoa monta do zero", async () => {
    ligar();
    identificar(PESSOA);
    await esperar();
    limpar();
    await esperar();
    expect(api.destroy).toHaveBeenCalledTimes(1);
    identificar({ ...PESSOA, id: 8, nome: "Bia", email: "b@x.com" });
    await esperar();
    expect(api.destroy).toHaveBeenCalledTimes(1);
    expect(api.init).toHaveBeenCalledTimes(2);
    expect(api.init).toHaveBeenLastCalledWith(expect.objectContaining({ user: expect.objectContaining({ userId: "8", nome: "Bia" }) }));
  });

  it("sair durante o carregamento não deixa widget para a próxima pessoa", async () => {
    ligar();
    identificar(PESSOA);
    limpar();
    await esperar();
    expect(api.init).not.toHaveBeenCalled();
  });

  it("falha ao carregar não lança erro e tenta de novo na próxima identificação", async () => {
    ligar();
    loadSpace.mockImplementationOnce(() => Promise.reject(new Error("bloqueado")));
    expect(() => identificar(PESSOA)).not.toThrow();
    await esperar();
    expect(api.init).not.toHaveBeenCalled();
    identificar({ ...PESSOA, loja: "Outra" });
    await esperar();
    expect(api.init).toHaveBeenCalledTimes(1);
  });

  it("falha ao montar ou desmontar não lança erro", async () => {
    ligar();
    api.init.mockImplementationOnce(() => Promise.reject(new Error("falha")));
    expect(() => identificar(PESSOA)).not.toThrow();
    await esperar();
    api.destroy.mockImplementationOnce(() => Promise.reject(new Error("falha")));
    expect(() => limpar()).not.toThrow();
    await esperar();
  });
});
