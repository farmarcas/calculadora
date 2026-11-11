import { useEffect, useState } from "react";
import { api, baixarArquivo } from "../../api/client.js";
import { Aviso, Botao, Modal } from "../../components/ui/index.jsx";
import { AVISO_MONTADO_AGORA, FRASE_FINAL, linhasDoCabecalho, nomeDoArquivoPdf, tituloDoParecer } from "./parecer-regras.js";

const Secao = ({ titulo, itens }) => (
  <section className="mt-3" aria-label={titulo}>
    <h4 className="m-0 text-sm font-bold text-[var(--text-strong)]">{titulo}</h4>
    <ul className="m-0 mt-1 list-disc pl-5 text-sm leading-5 text-[var(--text-strong)]">
      {itens.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  </section>
);

// O parecer do cenário salvo (spec 056): resumo, decisões, efeitos e a observação de quem salvou, separada do texto automático,
// com o botão "Baixar parecer em PDF". Dono, gestor e consulta veem; o texto já vem do servidor na versão do perfil.
export default function ParecerDoCenario({ id, onFechar }) {
  const [p, setP] = useState(null);
  const [erro, setErro] = useState(null);
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    let vivo = true;
    api(`/simulacoes/${id}/parecer`).then((r) => vivo && setP(r)).catch((e) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [id]);

  const baixar = async () => {
    setBaixando(true);
    try {
      await baixarArquivo(`/simulacoes/${id}/parecer.pdf`, nomeDoArquivoPdf(p.nome));
    } catch (e) {
      setErro(e.message);
    } finally {
      setBaixando(false);
    }
  };

  return (
    <Modal titulo={p ? tituloDoParecer(p) : "Parecer do cenário"} onClose={onFechar} largo>
      {erro && <Aviso>{erro}</Aviso>}
      {!p && !erro && <p className="m-0 text-sm text-[var(--text-secondary)]">Carregando o parecer…</p>}
      {p && (
        <article data-testid="parecer" className="flex flex-col">
          {linhasDoCabecalho(p).map((l, i) => <p key={i} className="m-0 text-xs text-[var(--text-secondary)]">{l}</p>)}
          {p.montadoAgora && <p className="m-0 mt-1 text-xs font-bold text-[var(--text-secondary)]" data-testid="parecer-montado-agora">{AVISO_MONTADO_AGORA}</p>}

          <section className="mt-4" aria-label="Resumo">
            <h3 className="m-0 text-base font-bold text-[var(--text-strong)]">Resumo</h3>
            {p.resumo.map((f, i) => <p key={i} className="m-0 mt-1 text-sm leading-5 text-[var(--text-strong)]">{f}</p>)}
          </section>

          <h3 className="m-0 mt-5 text-base font-bold text-[var(--text-strong)]">Decisões</h3>
          {p.decisoes.map((s) => <Secao key={s.titulo} {...s} />)}

          <h3 className="m-0 mt-5 text-base font-bold text-[var(--text-strong)]">Efeitos</h3>
          {p.efeitos.map((s) => <Secao key={s.titulo} {...s} />)}

          {p.observacao && (
            <section className="mt-5 rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3" aria-label="Observação de quem salvou" data-testid="parecer-observacao">
              <h3 className="m-0 text-sm font-bold text-[var(--text-strong)]">Observação de quem salvou</h3>
              <p className="m-0 mt-1 whitespace-pre-line text-sm leading-5 italic text-[var(--text-strong)]">{p.observacao}</p>
            </section>
          )}

          <p className="m-0 mt-5 text-xs text-[var(--text-secondary)]">{FRASE_FINAL}</p>
          <div className="mt-4 flex justify-end">
            <Botao onClick={baixar} disabled={baixando}>{baixando ? "Baixando…" : "Baixar parecer em PDF"}</Botao>
          </div>
        </article>
      )}
    </Modal>
  );
}
