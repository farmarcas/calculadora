import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("mixpanel-browser", () => ({
  default: { init: vi.fn(), identify: vi.fn(), track: vi.fn(), reset: vi.fn(), start_session_recording: vi.fn(), stop_session_recording: vi.fn(), set_config: vi.fn(), people: { set: vi.fn() },
    flags: { load_flags: vi.fn(() => Promise.resolve()), update_context: vi.fn(() => Promise.resolve()), is_enabled_sync: vi.fn(), get_variant_value_sync: vi.fn() } },
}));
import mixpanel from "mixpanel-browser";
import { propriedadesPermitidas } from "./catalogo.js";
import { aoMudarFlags, flagLigada, flagsLigadas, identificar, iniciar, limpar, percentualDeGravacao, registrar, variante, versaoDasFlags } from "./servico.js";

const PESSOA = { id: 7, nome: "Ana", email: "ana@x.com", perfil: "TENANT_ADMIN" };
const ligar = (extra = {}) => iniciar({ token: "tok", ambiente: "producao", replayPercent: "0", ...extra });
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

  it("envia as propriedades da pessoa e descarta o que não está na lista", () => {
    ligar();
    identificar({
      id: 7, nome: "Ana", email: "ana@x.com", perfil: "TENANT_ADMIN", papel_radar: "admin", operador: false,
      quantidade_grupos: 2, quantidade_lojas: 15, acesso_total: true,
      cnpj: "12345678000190", nome_do_grupo: "Rede Boa", quantidade_grupos_texto: "muitos",
    });
    expect(mixpanel.people.set).toHaveBeenCalledWith({
      $name: "Ana", $email: "ana@x.com", perfil: "TENANT_ADMIN", papel_radar: "admin", operador: false,
      quantidade_grupos: 2, quantidade_lojas: 15, acesso_total: true,
    });
  });

  it("ignora valores de tipo errado nas propriedades da pessoa", () => {
    ligar();
    identificar({ id: 7, nome: "Ana", email: "a@x.com", operador: "sim", quantidade_lojas: -3, quantidade_grupos: 1.5, papel_radar: "x".repeat(60) });
    expect(mixpanel.people.set).toHaveBeenCalledWith({ $name: "Ana", $email: "a@x.com" });
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

describe("mapa de calor e replay", () => {
  it("inicia com tudo coberto, sem console nem rede, e sem gravar no init", () => {
    ligar();
    expect(mixpanel.init).toHaveBeenCalledWith("tok", expect.objectContaining({
      record_sessions_percent: 0,
      record_heatmap_data: true,
      record_mask_all_text: true,
      record_mask_inputs: true,
      record_console: false,
      record_network: false,
      record_canvas: false,
      record_max_ms: 3_600_000,
    }));
    expect(mixpanel.start_session_recording).not.toHaveBeenCalled();
  });

  it("não grava antes de identificar a pessoa", () => {
    ligar({ replayPercent: "100" });
    registrar("login_concluido");
    expect(mixpanel.start_session_recording).not.toHaveBeenCalled();
  });

  it("grava depois de identificar, uma vez só, mesmo se o perfil mudar", () => {
    ligar({ replayPercent: "100" });
    identificar({ id: 7, nome: "Ana", email: "a@x.com", perfil: "SCHEDULE_VIEWER" });
    identificar({ id: 7, nome: "Ana", email: "a@x.com", perfil: "TENANT_ADMIN" });
    expect(mixpanel.start_session_recording).toHaveBeenCalledTimes(1);
  });

  it("com percentual 0 nunca grava", () => {
    ligar({ replayPercent: "0" });
    identificar(PESSOA);
    expect(mixpanel.start_session_recording).not.toHaveBeenCalled();
  });

  it("respeita o sorteio: sessão fora da parcela não grava", () => {
    ligar({ replayPercent: "25", sorteio: () => 0.5 });
    identificar(PESSOA);
    expect(mixpanel.start_session_recording).not.toHaveBeenCalled();
    limpar();
    iniciar({ token: "tok", replayPercent: "25", sorteio: () => 0.1 });
    identificar(PESSOA);
    expect(mixpanel.start_session_recording).toHaveBeenCalledTimes(1);
  });

  it("limpar para a gravação", () => {
    ligar({ replayPercent: "100" });
    identificar(PESSOA);
    limpar();
    expect(mixpanel.stop_session_recording).toHaveBeenCalledTimes(1);
  });

  it("limpar sem gravação não tenta parar", () => {
    ligar({ replayPercent: "0" });
    identificar(PESSOA);
    limpar();
    expect(mixpanel.stop_session_recording).not.toHaveBeenCalled();
  });

  it("falha ao começar a gravar não vaza para a tela", () => {
    ligar({ replayPercent: "100" });
    mixpanel.start_session_recording.mockImplementationOnce(() => {
      throw new Error("falhou");
    });
    expect(() => identificar(PESSOA)).not.toThrow();
  });

  it("sem token não grava", () => {
    iniciar({ token: "", replayPercent: "100" });
    identificar(PESSOA);
    expect(mixpanel.start_session_recording).not.toHaveBeenCalled();
  });
});

describe("percentualDeGravacao", () => {
  it.each([
    [undefined, 100],
    ["", 100],
    ["  ", 100],
    ["0", 0],
    ["25", 25],
    ["100", 100],
    ["101", 0],
    ["-5", 0],
    ["abc", 0],
  ])("%j vira %i", (entrada, esperado) => {
    expect(percentualDeGravacao(entrada)).toBe(esperado);
  });
});

describe("feature flags e experimentos", () => {
  const ligarComFlags = (extra = {}) => ligar(extra);

  it("sobe com as flags desligadas e não busca nada antes de identificar", () => {
    ligarComFlags();
    expect(mixpanel.init).toHaveBeenCalledWith("tok", expect.objectContaining({ flags: false }));
    expect(mixpanel.set_config).not.toHaveBeenCalled();
    expect(mixpanel.flags.load_flags).not.toHaveBeenCalled();
  });

  it("sem token, nem consulta nem erro, e devolve o padrão", () => {
    iniciar({ token: "" });
    identificar(PESSOA);
    expect(mixpanel.set_config).not.toHaveBeenCalled();
    expect(flagLigada("nova")).toBe(false);
    expect(variante("nova", "A")).toBe("A");
  });

  it("liga as flags ao identificar, com as propriedades da pessoa como contexto, antes do identify", () => {
    ligarComFlags();
    identificar({ ...PESSOA, operador: true, quantidade_lojas: 3 });
    expect(mixpanel.set_config).toHaveBeenCalledWith({ flags: { context: { custom_properties: expect.objectContaining({ perfil: "TENANT_ADMIN", operador: true, quantidade_lojas: 3 }) } } });
    expect(mixpanel.set_config.mock.invocationCallOrder[0]).toBeLessThan(mixpanel.identify.mock.invocationCallOrder[0]);
    expect(mixpanel.flags.load_flags).toHaveBeenCalledTimes(1);
  });

  it("não leva nome nem e-mail para o contexto das flags", () => {
    ligarComFlags();
    identificar(PESSOA);
    const contexto = JSON.stringify(mixpanel.set_config.mock.calls[0][0]);
    expect(contexto).not.toContain("Ana");
    expect(contexto).not.toContain("ana@x.com");
  });

  it("mudança só de propriedades da mesma pessoa atualiza o contexto, sem novo identify", () => {
    ligarComFlags();
    identificar(PESSOA);
    identificar({ ...PESSOA, perfil: "SCHEDULE_VIEWER" });
    expect(mixpanel.identify).toHaveBeenCalledTimes(1);
    expect(mixpanel.flags.update_context).toHaveBeenCalledWith({ custom_properties: expect.objectContaining({ perfil: "SCHEDULE_VIEWER" }) });
  });

  it("flagLigada e variante leem do Mixpanel depois de identificar", () => {
    ligarComFlags();
    identificar(PESSOA);
    mixpanel.flags.is_enabled_sync.mockReturnValue(true);
    mixpanel.flags.get_variant_value_sync.mockReturnValue("B");
    expect(flagLigada("nova")).toBe(true);
    expect(variante("tela", "A")).toBe("B");
    expect(mixpanel.flags.get_variant_value_sync).toHaveBeenCalledWith("tela", "A");
  });

  it("antes de identificar devolve o padrão, sem perguntar ao Mixpanel", () => {
    ligarComFlags();
    expect(flagLigada("nova")).toBe(false);
    expect(variante("tela", "A")).toBe("A");
    expect(mixpanel.flags.is_enabled_sync).not.toHaveBeenCalled();
  });

  it("flag que não existe ou valor que não é verdadeiro vale desligada", () => {
    ligarComFlags();
    identificar(PESSOA);
    mixpanel.flags.is_enabled_sync.mockReturnValue(undefined);
    expect(flagLigada("nao-existe")).toBe(false);
  });

  it("erro do SDK nunca lança e vale o padrão", () => {
    ligarComFlags();
    identificar(PESSOA);
    mixpanel.flags.is_enabled_sync.mockImplementation(() => { throw new Error("falha"); });
    mixpanel.flags.get_variant_value_sync.mockImplementation(() => { throw new Error("falha"); });
    expect(flagLigada("x")).toBe(false);
    expect(variante("x", "A")).toBe("A");
    mixpanel.flags.load_flags.mockReturnValueOnce(Promise.reject(new Error("rede")));
    expect(() => identificar({ ...PESSOA, id: 9 })).not.toThrow();
  });

  it("limpar desliga as flags antes do reset e volta ao padrão", () => {
    ligarComFlags();
    identificar(PESSOA);
    limpar();
    expect(mixpanel.set_config).toHaveBeenLastCalledWith({ flags: false });
    expect(mixpanel.set_config.mock.invocationCallOrder.at(-1)).toBeLessThan(mixpanel.reset.mock.invocationCallOrder[0]);
    mixpanel.flags.is_enabled_sync.mockReturnValue(true);
    expect(flagLigada("nova")).toBe(false);
  });

  it("com a chave desligada (0 ou false) nunca liga nem consulta", () => {
    for (const valor of ["0", "false", "FALSE"]) {
      vi.clearAllMocks();
      ligarComFlags({ flags: valor });
      identificar(PESSOA);
      expect(mixpanel.set_config).not.toHaveBeenCalled();
      expect(mixpanel.flags.load_flags).not.toHaveBeenCalled();
      expect(flagLigada("nova")).toBe(false);
    }
  });

  it("avisa os ouvintes quando as flags chegam e quando saem", async () => {
    ligarComFlags();
    const ouvinte = vi.fn();
    const parar = aoMudarFlags(ouvinte);
    const antes = versaoDasFlags();
    identificar(PESSOA);
    await Promise.resolve();
    await Promise.resolve();
    expect(ouvinte).toHaveBeenCalledTimes(1);
    expect(versaoDasFlags()).toBeGreaterThan(antes);
    limpar();
    expect(ouvinte).toHaveBeenCalledTimes(2);
    parar();
  });
});

describe("flagsLigadas", () => {
  it("vazio liga; 0 e false desligam", () => {
    expect(flagsLigadas("")).toBe(true);
    expect(flagsLigadas(undefined)).toBe(true);
    expect(flagsLigadas("1")).toBe(true);
    expect(flagsLigadas("0")).toBe(false);
    expect(flagsLigadas(" False ")).toBe(false);
  });
});
