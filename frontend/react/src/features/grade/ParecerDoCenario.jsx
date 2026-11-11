import { useEffect, useState } from "react";
import { api, baixarArquivo } from "../../api/client.js";
import { Aviso, Botao, Modal } from "../../components/ui/index.jsx";
import ParecerCartoes from "./ParecerCartoes.jsx";
import ParecerTabela from "./ParecerTabela.jsx";
import { AVISO_DE_ESTIMATIVA, AVISO_MONTADO_AGORA, AVISO_SO_DONO, MENSAGEM_ERRO_PDF, estiloDoChip, linhasDoSubtitulo, nomeDoArquivoPdf, textoDoStatus, tituloDoParecer } from "./parecer-regras.js";

const Carregando = () => <span aria-hidden="true" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;

// O parecer do cenário salvo (specs 056 e 057): chip de status, parágrafo, três números grandes, "O que muda" e a observação de quem
// salvou, com o rodapé fixo ("Fechar" e "Baixar parecer em PDF"). Dono, gestor e consulta veem; o conteúdo já vem do servidor na
// versão do perfil (gestor e consulta, sem valores em reais).
export default function ParecerDoCenario({ id, onFechar, abridor = null }) {
  const [p, setP] = useState(null);
  const [erro, setErro] = useState(null);
  const [baixando, setBaixando] = useState(false);
  const [erroDoPdf, setErroDoPdf] = useState(false);

  useEffect(() => {
    let vivo = true;
    api(`/simulacoes/${id}/parecer`).then((r) => vivo && setP(r)).catch((e) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [id]);

  const baixar = async () => {
    setBaixando(true);
    setErroDoPdf(false);
    try {
      await baixarArquivo(`/simulacoes/${id}/parecer.pdf`, nomeDoArquivoPdf(p.loja, p.numeroCenario));
    } catch {
      setErroDoPdf(true);
    } finally {
      setBaixando(false);
    }
  };

  const subtitulo = p && (
    <div className="mt-1">
      {linhasDoSubtitulo(p).map((l, i) => <p key={i} className="m-0 text-xs leading-4 text-[var(--text-secondary)]">{l}</p>)}
      {p.montadoAgora && <p className="m-0 mt-1 text-xs leading-4 font-bold text-[var(--text-secondary)]" data-testid="parecer-montado-agora">{AVISO_MONTADO_AGORA}</p>}
    </div>
  );

  const rodape = (
    <div className="flex flex-col gap-2">
      {erroDoPdf && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-btn bg-[var(--func-warning-50)] px-3 py-2 text-sm leading-5 text-[#8b0020]" data-testid="erro-do-pdf">
          <span>{MENSAGEM_ERRO_PDF}</span>
          <button type="button" onClick={baixar} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-[#8b0020] underline">Tentar de novo</button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 max-w-[420px] text-xs leading-4 text-[var(--text-secondary)]" data-testid="parecer-rodape-aviso">
          {AVISO_DE_ESTIMATIVA}
          {p?.semValoresEmReais ? ` ${AVISO_SO_DONO}` : ""}
        </p>
        <div className="flex gap-2">
          <Botao tipo="secundario" type="button" onClick={onFechar}>Fechar</Botao>
          <Botao type="button" onClick={baixar} disabled={!p || baixando} aria-busy={baixando}>
            {baixando ? <span className="inline-flex items-center gap-2"><Carregando />Baixando…</span> : "Baixar parecer em PDF"}
          </Botao>
        </div>
      </div>
    </div>
  );

  return (
    <Modal titulo={p ? tituloDoParecer(p) : "Parecer do cenário"} subtitulo={subtitulo} rodape={rodape} onClose={onFechar} devolverFocoPara={abridor} largo>
      {erro && <Aviso>{erro}</Aviso>}
      {!p && !erro && <p className="m-0 text-sm text-[var(--text-secondary)]">Carregando o parecer…</p>}
      {p && (
        <article data-testid="parecer" className="flex flex-col gap-5">
          <div>
            <span className="inline-block rounded-full border px-3 py-0.5 text-xs leading-5 font-bold" style={estiloDoChip(p.status.tom)} data-testid="parecer-status" data-tom={p.status.tom}>{textoDoStatus(p.status)}</span>
          </div>
          <p className="m-0 text-sm leading-[1.6] text-[var(--text-strong)]" data-testid="parecer-paragrafo">{p.paragrafo}</p>
          <ParecerCartoes cartoes={p.cartoes} />
          <ParecerTabela linhas={p.tabela} />
          {p.horarioAMais?.map((linha, i) => <p key={i} className="m-0 text-sm leading-5 text-[var(--text-strong)]" data-testid="parecer-horario-a-mais">{linha}</p>)}
          {p.observacao && (
            <section className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3" aria-label="Observação de quem salvou" data-testid="parecer-observacao">
              <h3 className="m-0 text-sm font-bold text-[var(--text-strong)]">Observação de quem salvou</h3>
              <p className="m-0 mt-1 whitespace-pre-line text-sm leading-5 italic text-[var(--text-strong)]">{p.observacao}</p>
            </section>
          )}
        </article>
      )}
    </Modal>
  );
}
