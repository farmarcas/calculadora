import { useState } from "react";
import { api, baixarModelo } from "../../api/client.js";
import { Botao } from "../../components/ui/index.jsx";
import AreaDeEnvio from "../../components/importacao/AreaDeEnvio.jsx";
import AvisoCaixa from "../../components/importacao/AvisoCaixa.jsx";
import JanelaDeImportacao from "../../components/importacao/JanelaDeImportacao.jsx";
import PassoNumerado from "../../components/importacao/PassoNumerado.jsx";
import Progresso from "../../components/importacao/Progresso.jsx";
import QuadroDoArquivo from "../../components/importacao/QuadroDoArquivo.jsx";
import { IconeDownload } from "../../components/importacao/icones.jsx";
import { baixarTexto, erroDoArquivo, linhaDeErro, listaDeErrosCsv, plural, sucessoDoCadastro, tamanhoLegivel, textoGravar } from "../../components/importacao/formato.js";
import { useAviso } from "../../shell/AvisoGlobal.jsx";
import { linhasDaRevisao, totaisDoBotao, totalAGravar } from "./revisao.js";

const MENSAGEM_CONEXAO = "Não conseguimos enviar agora. Confira a conexão e tente de novo.";
const mensagemDe = (e) => (e instanceof TypeError ? MENSAGEM_CONEXAO : e?.message || MENSAGEM_CONEXAO);

// "Importar lojas e funcionários": três passos (baixar o modelo, preencher, enviar) e uma revisão antes de gravar.
// `podeLojas`: quem importa a aba Lojas (os demais perfis importam só a equipe).
export default function ModalImportarCadastro({ onClose, onConcluido, podeLojas = false }) {
  const { mostrar } = useAviso();
  const [arquivo, setArquivo] = useState(null);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(null); // null | "lendo" | "gravando"
  const [rev, setRev] = useState(null); // { id, mapeamento, revisao }

  const escolher = (a) => {
    setRev(null);
    const e = erroDoArquivo(a);
    setErro(e);
    setArquivo(e ? null : a);
  };

  const revisar = async () => {
    setErro(null);
    setOcupado("lendo");
    try {
      const form = new FormData();
      form.append("arquivo", arquivo);
      const up = await api("/importacoes/cadastro", { method: "POST", form });
      const revisao = await api(`/importacoes/cadastro/${up.id}/revisar`, { method: "POST", body: { mapeamento: up.mapeamento } });
      setRev({ id: up.id, mapeamento: up.mapeamento, revisao });
    } catch (e) {
      setErro(mensagemDe(e));
      setArquivo(null);
    } finally {
      setOcupado(null);
    }
  };

  const gravar = async () => {
    setErro(null);
    setOcupado("gravando");
    try {
      const resumo = await api(`/importacoes/cadastro/${rev.id}/confirmar`, { method: "POST", body: { mapeamento: rev.mapeamento } });
      onConcluido?.();
      mostrar(sucessoDoCadastro(resumo), resumo.erros?.length ? "atencao" : "ok");
      onClose();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setOcupado(null);
    }
  };

  const trocar = () => { setRev(null); setArquivo(null); setErro(null); };
  const revisao = rev?.revisao;
  const erros = revisao?.erros ?? [];
  const aGravar = revisao ? totalAGravar(revisao, podeLojas) : 0;

  return (
    <JanelaDeImportacao
      titulo="Importar lojas e funcionários"
      onFechar={onClose}
      ocupado={!!ocupado}
      anuncio={ocupado === "lendo" ? "Lendo a planilha…" : ocupado === "gravando" ? "Gravando…" : arquivo ? `Arquivo escolhido: ${arquivo.name}` : ""}
      textoPrincipal={revisao ? textoGravar(totaisDoBotao(revisao, podeLojas)) : "Revisar planilha"}
      onPrincipal={revisao ? gravar : revisar}
      principalDesabilitado={revisao ? aGravar === 0 : !arquivo}
    >
      <p className="m-0 text-sm text-[var(--text-secondary)]">Atualize várias lojas e suas equipes de uma vez, com uma planilha.</p>

      {!revisao && (
        <>
          <AvisoCaixa tom="info">Lojas que já existem são atualizadas. Antes de gravar, você revisa o que o Radar entendeu.</AvisoCaixa>
          <PassoNumerado
            numero={1}
            titulo="Baixe a planilha modelo"
            descricao="Ela tem duas abas: Lojas e Funcionários."
            acao={<Botao tipo="secundario" onClick={baixarModelo} disabled={!!ocupado}><IconeDownload />Baixar modelo</Botao>}
          />
          <PassoNumerado numero={2} titulo="Preencha e salve" descricao="Deixe em branco o que não quer mudar. O Radar mantém o que já está cadastrado." />
          <PassoNumerado numero={3} titulo="Envie a planilha" descricao="Aceitamos .xlsx e .csv.">
            {erro && <div className="mb-3"><AvisoCaixa tom="erro">{erro}</AvisoCaixa></div>}
            {ocupado === "lendo" ? (
              <Progresso texto="Lendo a planilha…" />
            ) : arquivo ? (
              <QuadroDoArquivo nome={arquivo.name} apoio={tamanhoLegivel(arquivo.size)} onTrocar={trocar} />
            ) : (
              <AreaDeEnvio onArquivo={escolher} desabilitado={!!ocupado} />
            )}
          </PassoNumerado>
        </>
      )}

      {revisao && (
        <>
          <QuadroDoArquivo nome={arquivo?.name ?? revisao.arquivo} apoio={`${tamanhoLegivel(arquivo?.size)} · enviada agora`} onTrocar={trocar} desabilitado={!!ocupado} />
          {ocupado === "gravando" && <Progresso texto="Gravando…" />}
          {erro && <AvisoCaixa tom="erro">{erro}</AvisoCaixa>}
          <div>
            <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">O que o Radar entendeu</h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-[11px] uppercase text-[var(--text-secondary)]">
                  <th scope="col" className="py-1 text-left font-bold"><span className="sr-only">Aba</span></th>
                  <th scope="col" className="py-1 text-right font-bold">Atualiza</th>
                  <th scope="col" className="py-1 text-right font-bold">Novas</th>
                  <th scope="col" className="py-1 text-right font-bold">Com erro</th>
                </tr>
              </thead>
              <tbody>
                {linhasDaRevisao(revisao, podeLojas).map((l) => (
                  <tr key={l.chave} className="border-t border-[var(--border-subtle)]">
                    <th scope="row" className="py-2 text-left font-bold text-[var(--text-strong)]">{l.rotulo}</th>
                    <td className="py-2 text-right">{l.atualiza}</td>
                    <td className="py-2 text-right">{l.novas}</td>
                    <td className={`py-2 text-right ${l.comErro ? "font-bold text-[#8b0020]" : ""}`}>{l.comErro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {revisao.avisos?.length > 0 && (
            <AvisoCaixa tom="info"><ul className="m-0 list-disc pl-5">{revisao.avisos.map((a, i) => <li key={i}>{a}</li>)}</ul></AvisoCaixa>
          )}
          {erros.length > 0 && (
            <AvisoCaixa tom="atencao" titulo={`${plural(erros.length, "linha com problema", "linhas com problema")}. ${erros.length === 1 ? "Ela não será gravada" : "Elas não serão gravadas"}.`}>
              <ul className="m-0 mt-1 list-disc pl-5">
                {erros.slice(0, 5).map((e, i) => <li key={i}>{linhaDeErro(e)}</li>)}
              </ul>
              {erros.length > 5 && <p className="m-0 mt-1">E mais {erros.length - 5}. A lista completa está no arquivo.</p>}
              <button type="button" onClick={() => baixarTexto("linhas-com-erro.csv", listaDeErrosCsv(erros))} className="mt-2 border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link,#006ff7)] cursor-pointer hover:underline">Baixar lista de erros</button>
            </AvisoCaixa>
          )}
          {aGravar === 0 && <AvisoCaixa tom="info">Não há nenhuma linha para gravar. Corrija a planilha e envie de novo.</AvisoCaixa>}
        </>
      )}
    </JanelaDeImportacao>
  );
}
