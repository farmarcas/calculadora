import { useMemo, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Ficha, Modal, entrada } from "../../components/ui/index.jsx";
import { formatarCnpj } from "../../api/perfis.js";

const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-3 py-2";
const TD = "px-3 py-2 border-t border-line align-top";
const CAMPOS = { nome: "Nome", cidade: "Cidade", uf: "UF", marca: "Bandeira", regimeTributario: "Regime tributário", horarios: "Horário" };
const POR_PAGINA = 50;

const valor = (campo, v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (campo === "horarios") {
    const abertos = (v.dias ?? []).filter((d) => d.aberta);
    const seg = v.dias?.[0]?.aberta ? `${v.dias[0].abre}–${v.dias[0].fecha}` : "fechada";
    return abertos.length ? `${abertos.length} ${abertos.length === 1 ? "dia aberto" : "dias abertos"} (seg ${seg})` : "fechada";
  }
  return String(v);
};

const Numero = ({ n, rotulo, tom }) => (
  <div className="rounded-card border border-line px-4 py-3">
    <div className={`text-2xl font-bold ${tom ?? ""}`}>{n}</div>
    <div className="text-xs text-ink-500">{rotulo}</div>
  </div>
);

// Envio do relatório de lojas da plataforma: confere (nada é gravado), mostra o que vai acontecer e só grava ao confirmar.
export default function CargaLojas({ onClose, onConcluido }) {
  const [conf, setConf] = useState(null);
  const [res, setRes] = useState(null);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [busca, setBusca] = useState("");
  const [mostrar, setMostrar] = useState(POR_PAGINA);
  // Conflitos que o operador quer substituir pelo valor da planilha (por padrão, nenhum: mantém a correção do empresário).
  const [trocar, setTrocar] = useState(new Set());

  const enviar = async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErro(null);
    setOcupado(true);
    try {
      const form = new FormData();
      form.append("arquivo", arquivo);
      setConf(await api("/cargas-lojas", { method: "POST", form }));
    } catch (err) {
      setErro(err.message);
    } finally {
      setOcupado(false);
    }
  };

  const cnpjsEmConflito = useMemo(() => [...new Set((conf?.conflitos ?? []).map((c) => c.cnpj))], [conf]);
  const alternar = (cnpj) => setTrocar((s) => { const n = new Set(s); if (n.has(cnpj)) n.delete(cnpj); else n.add(cnpj); return n; });

  const confirmar = async () => {
    setErro(null);
    setOcupado(true);
    try {
      const substituirConflitos = trocar.size === 0 ? "nenhum" : trocar.size >= cnpjsEmConflito.length ? "todos" : [...trocar];
      setRes(await api(`/cargas-lojas/${conf.id}/confirmar`, { method: "POST", body: { substituirConflitos } }));
      onConcluido();
    } catch (err) {
      setErro(err.message);
    } finally {
      setOcupado(false);
    }
  };

  const grupos = (conf?.porGe ?? []).filter((g) => `${g.nome} ${g.identificacao}`.toLowerCase().includes(busca.toLowerCase()));
  const t = conf?.totais;
  const nada = t && t.criar + t.atualizar + t.gesNovos === 0;

  return (
    <Modal titulo="Enviar Excel de lojas" onClose={onClose} largo>
      <div className="flex flex-col gap-4">
        {erro && <Aviso>{erro}</Aviso>}

        {!conf && !res && (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm text-ink-700">Envie o relatório de lojas da plataforma (.xlsx). O arquivo pode trazer vários grupos: os que não existem são criados. Só entram lojas com status <strong>Ativado</strong>. Nada é gravado antes de você conferir e confirmar.</p>
            <input type="file" accept=".xlsx,.csv" onChange={enviar} disabled={ocupado} aria-label="Arquivo do relatório de lojas" />
            {ocupado && <p className="m-0 text-sm text-ink-500">Lendo o arquivo…</p>}
          </div>
        )}

        {conf && !res && (
          <>
            <Aviso tom="neutro">Arquivo <strong>{conf.arquivo}</strong> ({conf.totalLinhas} linhas). Confira o que vai acontecer. <strong>Nada foi gravado ainda.</strong></Aviso>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Numero n={t.gesNovos} rotulo="grupos novos" />
              <Numero n={t.criar} rotulo="lojas a criar" />
              <Numero n={t.atualizar} rotulo="lojas a atualizar" />
              <Numero n={t.semMudanca} rotulo="sem mudança" />
              <Numero n={t.conflitos} rotulo="conflitos" tom={t.conflitos ? "text-attention-700" : ""} />
              <Numero n={t.rejeitadas} rotulo="rejeitadas" tom={t.rejeitadas ? "text-error-600" : ""} />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(conf.ignoradasPorStatus).map(([s, n]) => <Ficha key={s}>{n} {s.toLowerCase()} (ignoradas)</Ficha>)}
              {conf.pendencias.semRegime > 0 && <Ficha tom="atencao">{conf.pendencias.semRegime} sem regime tributário</Ficha>}
              {conf.pendencias.semHorario > 0 && <Ficha tom="atencao">{conf.pendencias.semHorario} sem horário</Ficha>}
              {conf.pendencias.horarioAjustado > 0 && <Ficha tom="atencao">{conf.pendencias.horarioAjustado} com horário ajustado</Ficha>}
            </div>

            {conf.conflitos.length > 0 && (
              <section className="border border-line rounded-card">
                <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-line">
                  <div>
                    <h3 className="m-0 text-sm font-medium">Conflitos ({t.conflitos})</h3>
                    <p className="m-0 mt-1 text-xs text-ink-500">O empresário corrigiu estes dados e a plataforma também mudou. Por padrão, a correção dele é mantida. Marque os que você quer substituir pelo valor da planilha.</p>
                  </div>
                  <div className="flex gap-2">
                    <Botao tipo="secundario" onClick={() => setTrocar(new Set(cnpjsEmConflito))}>Substituir todos</Botao>
                    <Botao tipo="texto" onClick={() => setTrocar(new Set())}>Manter todos</Botao>
                  </div>
                </header>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead><tr><th className={TH}>Substituir</th><th className={TH}>Grupo</th><th className={TH}>Loja</th><th className={TH}>Campo</th><th className={TH}>Hoje</th><th className={TH}>Planilha</th></tr></thead>
                    <tbody>
                      {conf.conflitos.map((c, i) => (
                        <tr key={i}>
                          <td className={TD}><input type="checkbox" aria-label={`Substituir ${c.loja}`} checked={trocar.has(c.cnpj)} onChange={() => alternar(c.cnpj)} /></td>
                          <td className={TD}>{c.ge}</td><td className={TD}>{c.loja}<div className="text-xs text-ink-500">{formatarCnpj(c.cnpj)}</div></td>
                          <td className={TD}>{CAMPOS[c.campo]}</td><td className={TD}>{valor(c.campo, c.atual)}</td><td className={TD}>{valor(c.campo, c.planilha)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {conf.rejeitadas.length > 0 && (
              <section className="border border-line rounded-card">
                <header className="px-4 py-3 border-b border-line"><h3 className="m-0 text-sm font-medium">Rejeitadas ({t.rejeitadas}): não entram</h3></header>
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead><tr><th className={TH}>Linha</th><th className={TH}>CNPJ</th><th className={TH}>Motivo</th></tr></thead>
                    <tbody>{conf.rejeitadas.map((r, i) => <tr key={i}><td className={TD}>{r.linha}</td><td className={TD}>{r.cnpj ? formatarCnpj(r.cnpj) : "—"}</td><td className={TD}>{r.motivo}</td></tr>)}</tbody>
                  </table>
                </div>
              </section>
            )}

            {(conf.saiuDoAtivo.length > 0 || conf.foraDoArquivo.length > 0) && (
              <Aviso tom="atencao">
                {conf.saiuDoAtivo.length > 0 && <p className="m-0">{t.saiuDoAtivo} loja(s) já cadastradas agora vêm como Desativado, Montando ou Transição (ex.: {conf.saiuDoAtivo.slice(0, 3).map((x) => `${x.nome} (${x.status})`).join(", ")}). <strong>Nenhuma é apagada nem desativada</strong>: decida depois.</p>}
                {conf.foraDoArquivo.length > 0 && <p className="m-0">{t.foraDoArquivo} loja(s) dos grupos do arquivo não aparecem nele (ex.: {conf.foraDoArquivo.slice(0, 3).map((x) => x.nome).join(", ")}). Ficam como estão.</p>}
              </Aviso>
            )}

            <section className="border border-line rounded-card">
              <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-line">
                <h3 className="m-0 text-sm font-medium">Por grupo ({conf.porGe.length})</h3>
                <input aria-label="Buscar grupo" placeholder="Buscar grupo" className={`${entrada} w-56`} value={busca} onChange={(e) => { setBusca(e.target.value); setMostrar(POR_PAGINA); }} />
              </header>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm border-collapse">
                  <thead><tr><th className={TH}>Grupo</th><th className={TH}>Nº</th><th className={TH}>Criar</th><th className={TH}>Atualizar</th><th className={TH}>Conflitos</th></tr></thead>
                  <tbody>
                    {grupos.slice(0, mostrar).map((g) => (
                      <tr key={g.identificacao}>
                        <td className={TD}>{g.nome} {g.novo && <Ficha tom="ok">novo</Ficha>}</td>
                        <td className={TD}>{g.identificacao}</td><td className={TD}>{g.criar}</td><td className={TD}>{g.atualizar}</td><td className={TD}>{g.conflitos}</td>
                      </tr>
                    ))}
                    {grupos.length === 0 && <tr><td className={`${TD} text-ink-500`} colSpan={5}>Nenhum grupo.</td></tr>}
                  </tbody>
                </table>
              </div>
              {grupos.length > mostrar && <div className="p-3 text-center"><Botao tipo="texto" onClick={() => setMostrar(mostrar + POR_PAGINA)}>Mostrar mais ({grupos.length - mostrar})</Botao></div>}
            </section>

            <div className="flex justify-end gap-2">
              <Botao tipo="texto" onClick={onClose}>Cancelar</Botao>
              <Botao onClick={confirmar} disabled={ocupado || nada}>{ocupado ? "Gravando…" : "Confirmar e gravar"}</Botao>
            </div>
          </>
        )}

        {res && (
          <>
            <Aviso tom="ok">
              {res.gesCriados} grupo(s) criado(s), {res.lojasCriadas} loja(s) criada(s), {res.lojasAtualizadas} atualizada(s).
              {res.conflitosMantidos > 0 && ` ${res.conflitosMantidos} correção(ões) do empresário mantida(s).`}
              {res.conflitosSubstituidos > 0 && ` ${res.conflitosSubstituidos} substituída(s) pela planilha.`}
            </Aviso>
            {res.rejeitadas > 0 && <p className="m-0 text-sm text-ink-700">{res.rejeitadas} linha(s) não entraram (as mesmas que a conferência mostrou).</p>}
            <div className="flex justify-end"><Botao onClick={onClose}>Fechar</Botao></div>
          </>
        )}
      </div>
    </Modal>
  );
}
