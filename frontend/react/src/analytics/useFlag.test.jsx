import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("mixpanel-browser", () => ({
  default: {
    init: vi.fn(), identify: vi.fn(), track: vi.fn(), reset: vi.fn(), set_config: vi.fn(),
    start_session_recording: vi.fn(), stop_session_recording: vi.fn(), people: { set: vi.fn() },
    flags: { load_flags: vi.fn(() => Promise.resolve()), update_context: vi.fn(() => Promise.resolve()), is_enabled_sync: vi.fn(), get_variant_value_sync: vi.fn() },
  },
}));
import mixpanel from "mixpanel-browser";
import { identificar, iniciar, limpar } from "./servico.js";
import { useFlag, useVariante } from "./useFlag.js";

const Tela = () => (useFlag("nova-tela") ? <p>nova</p> : <p>antiga</p>);
const Texto = () => <p>{useVariante("botao", "azul")}</p>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useFlag e useVariante", () => {
  it("sem token mostra o padrão, sem erro", () => {
    iniciar({ token: "" });
    expect(renderToString(<Tela />)).toContain("antiga");
    expect(renderToString(<Texto />)).toContain("azul");
  });

  it("antes de identificar mostra o padrão", () => {
    iniciar({ token: "tok", replayPercent: "0" });
    mixpanel.flags.is_enabled_sync.mockReturnValue(true);
    expect(renderToString(<Tela />)).toContain("antiga");
  });

  it("depois de identificar mostra o valor da flag e da versão", () => {
    iniciar({ token: "tok", replayPercent: "0" });
    identificar({ id: 1, nome: "Ana", email: "a@x.com", perfil: "TENANT_ADMIN" });
    mixpanel.flags.is_enabled_sync.mockReturnValue(true);
    mixpanel.flags.get_variant_value_sync.mockReturnValue("verde");
    expect(renderToString(<Tela />)).toContain("nova");
    expect(renderToString(<Texto />)).toContain("verde");
    limpar();
    expect(renderToString(<Tela />)).toContain("antiga");
  });
});
