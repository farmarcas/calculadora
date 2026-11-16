import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("mixpanel-browser", () => ({
  default: { init: vi.fn(), identify: vi.fn(), track: vi.fn(), reset: vi.fn(), people: { set: vi.fn() } },
}));
import mixpanel from "mixpanel-browser";
import { propriedadesPermitidas } from "./catalogo.js";
import { identificar, iniciar, limpar, registrar } from "./servico.js";

const PESSOA = { id: 7, nome: "Ana", email: "ana@x.com", perfil: "TENANT_ADMIN" };
const ligar = () => iniciar({ token: "tok", ambiente: "producao" });
const ligarComPessoa = () => {
  ligar();
  identificar(PESSOA);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sem token", () => {
  it("fica desligado e não envia nada", () => {
    iniciar({ token: "" });
    identificar({ id: 1, nome: "Ana", email: "a@x.com", perfil: "TENANT_ADMIN" });
    registrar("tela_vista", { tela: "escala" });
    limpar();
    expect(mixpanel.init).not.toHaveBeenCalled();
    expect(mixpanel.track).not.toHaveBeenCalled();
    expect(mixpanel.identify).not.toHaveBeenCalled();
  });
});

describe("com token", () => {
  it("inicia sem captura automática nem gravação de sessão", () => {
    ligar();
    expect(mixpanel.init).toHaveBeenCalledWith("tok", expect.objectContaining({ autocapture: false, record_sessions_percent: 0, track_pageview: false }));
  });

  it("usa o endereço da região quando informado", () => {
    iniciar({ token: "tok", apiHost: "https://api-eu.mixpanel.com" });
    expect(mixpanel.init).toHaveBeenCalledWith("tok", expect.objectContaining({ api_host: "https://api-eu.mixpanel.com" }));
  });

  it("registra o evento do catálogo com o ambiente", () => {
    ligarComPessoa();
    registrar("tela_vista", { tela: "escala", secao: "diagnostico" });
    expect(mixpanel.track).toHaveBeenCalledWith("tela_vista", { tela: "escala", secao: "diagnostico", ambiente: "producao" });
  });

  it("descarta evento fora do catálogo", () => {
    ligarComPessoa();
    registrar("clicou_no_botao", { tela: "escala" });
    expect(mixpanel.track).not.toHaveBeenCalled();
  });

  it("descarta propriedade fora da lista e valor fora do permitido", () => {
    ligarComPessoa();
    registrar("simulacao_criada", { regra_horas: 42, origem: "vazia", folha: 32584, loja: "Farmácia Centro", tela: "escala" });
    expect(mixpanel.track).toHaveBeenCalledWith("simulacao_criada", { regra_horas: 42, origem: "vazia", ambiente: "producao" });
    registrar("simulacao_criada", { regra_horas: 99, origem: "Texto livre com espaços" });
    expect(mixpanel.track).toHaveBeenLastCalledWith("simulacao_criada", { ambiente: "producao" });
  });

  it("identifica a pessoa com ID, nome, e-mail e perfil, sem repetir", () => {
    ligar();
    const p = { id: 7, nome: "Ana", email: "ana@x.com", perfil: "TENANT_ADMIN" };
    identificar(p);
    identificar(p);
    expect(mixpanel.identify).toHaveBeenCalledTimes(1);
    expect(mixpanel.identify).toHaveBeenCalledWith("7");
    expect(mixpanel.people.set).toHaveBeenCalledTimes(1);
    expect(mixpanel.people.set).toHaveBeenCalledWith({ $name: "Ana", $email: "ana@x.com", perfil: "TENANT_ADMIN" });
  });

  it("atualiza só o perfil quando ele muda, sem identificar de novo", () => {
    ligar();
    identificar({ id: 7, nome: "Ana", email: "ana@x.com", perfil: "SCHEDULE_VIEWER" });
    identificar({ id: 7, nome: "Ana", email: "ana@x.com", perfil: "TENANT_ADMIN" });
    expect(mixpanel.identify).toHaveBeenCalledTimes(1);
    expect(mixpanel.people.set).toHaveBeenCalledTimes(2);
  });

  it("sem pessoa identificada (demonstração) não mede, só o login passa", () => {
    ligar();
    registrar("tela_vista", { tela: "escala" });
    expect(mixpanel.track).not.toHaveBeenCalled();
    registrar("login_concluido");
    expect(mixpanel.track).toHaveBeenCalledWith("login_concluido", { ambiente: "producao" });
  });

  it("não identifica sem ID", () => {
    ligar();
    identificar({ nome: "Ana", email: "ana@x.com" });
    expect(mixpanel.identify).not.toHaveBeenCalled();
  });

  it("limpar desfaz a identidade e permite identificar outra pessoa", () => {
    ligar();
    identificar({ id: 7, nome: "Ana", email: "a@x.com", perfil: "X" });
    limpar();
    expect(mixpanel.reset).toHaveBeenCalledTimes(1);
    identificar({ id: 8, nome: "Bia", email: "b@x.com", perfil: "X" });
    expect(mixpanel.identify).toHaveBeenLastCalledWith("8");
  });

  it("falha do Mixpanel não vaza para a tela", () => {
    ligarComPessoa();
    mixpanel.track.mockImplementationOnce(() => {
      throw new Error("rede bloqueada");
    });
    mixpanel.identify.mockImplementationOnce(() => {
      throw new Error("falhou");
    });
    mixpanel.reset.mockImplementationOnce(() => {
      throw new Error("falhou");
    });
    expect(() => registrar("loja_trocada")).not.toThrow();
    expect(() => identificar({ id: 1, nome: "A", email: "a@x.com", perfil: "X" })).not.toThrow();
    expect(() => limpar()).not.toThrow();
  });

  it("falha ao iniciar deixa a medição desligada sem erro", () => {
    mixpanel.init.mockImplementationOnce(() => {
      throw new Error("falhou");
    });
    expect(() => iniciar({ token: "tok" })).not.toThrow();
  });
});

describe("catálogo", () => {
  it("evento sem propriedades aceita objeto vazio ou ausente", () => {
    expect(propriedadesPermitidas("loja_trocada")).toEqual({});
    expect(propriedadesPermitidas("login_concluido", undefined)).toEqual({});
  });
});
