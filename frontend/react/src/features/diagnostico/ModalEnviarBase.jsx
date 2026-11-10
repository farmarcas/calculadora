import { useState } from "react";
import { api, baixarArquivo } from "../../api/client.js";
import { Botao, entrada } from "../../components/ui/index.jsx";
import AreaDeEnvio from "../../components/importacao/AreaDeEnvio.jsx";
import AvisoCaixa from "../../components/importacao/AvisoCaixa.jsx";
import JanelaDeImportacao from "../../components/importacao/JanelaDeImportacao.jsx";
import PassoNumerado from "../../components/importacao/PassoNumerado.jsx";
import Progresso from "../../components/importacao/Progresso.jsx";
import QuadroDoArquivo from "../../components/importacao/QuadroDoArquivo.jsx";
import { IconeDownload } from "../../components/importacao/icones.jsx";
import { apoioDaBase, erroDoArquivo, linhaDeErro, plural, sucessoDaBase, textoDeSubstituicao } from "../../components/importacao/formato.js";
import { useAviso } from "../../shell/AvisoGlobal.jsx";
import { ehPorCnpj, periodoPreenchido, podeEnviar, resumoDaConferenciaPorCnpj, resumoDoEnvio, textoCadastroPorCnpj, textoCnpjsSemLoja, textoDoAviso, textoDoPeriodoPorCnpj, textoLojasNaoCadastradas } from "./base.js";

const MENSAGEM_CONEXAO = "Não conseguimos enviar agora. Confira a conexão e tente de novo.";
const mensagemDe = (e) => (e instanceof TypeError ? MENSAGEM_CONEXAO : e?.message || MENSAGEM_CONEXAO);

// "Enviar base comercial": três passos; ao escolher o arquivo mostra o quadro do arquivo (nome, tamanho, lojas e período) e
// avisa o envio anterior que será substituído. Nada é gravado até clicar em "Enviar base comercial".
export default function ModalEnviarBase({ onClose, onConcluido }) {
  const { mostrar } = useAviso();
  const [arquivo, setArquivo] = useState(null);
  const [revisao, setRevisao] = useState(null);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(null); // null | "lendo" | "conferindo" | "enviando"
  // Arquivo por CNPJ e dia da semana: os valores são totais de um período, que a pessoa informa.
  const [periodo, setPeriodo] = useState({ inicio: "", fim: "" });

  const form = (a, p = periodo) => {
    const f = new FormData();
    f.append("arquivo", a);
    if (periodoPreenchido(p.inicio, p.fim)) { f.append("periodoInicio", p.inicio); f.append("periodoFim", p.fim); }
    return f;
  };

  const escolher = async (a) => {
    setRevisao(null);
    setArquivo(null);
    setPeriodo({ inicio: "", fim: "" });
    const e = erroDoArquivo(a);
    setErro(e);
    if (e) return;
    setOcupado("lendo");
    try {
      setRevisao(await api("/cargas/base/revisar", { method: "POST", form: form(a) }));
      setArquivo(a);
    } catch (err) {
      setErro(mensagemDe(err));
    } finally {
      setOcupado(null);
    }
  };

  const enviar = async () => {
    setErro(null);
    setOcupado("enviando");
    try {
      const res = await api("/cargas/base", { method: "POST", form: form(arquivo) });
      const r = resumoDoEnvio(res);
      onConcluido?.();
      mostrar(sucessoDaBase(r), r.naoGravadas ? "atencao" : "ok");
      onClose();
    } catch (err) {
      setErro(mensagemDe(err));
    } finally {
      setOcupado(null);
    }
  };

  // Mudou uma das datas: com as duas preenchidas, o servidor confere de novo já com o período.
  const mudarPeriodo = async (novo) => {
    setPeriodo(novo);
    if (!periodoPreenchido(novo.inicio, novo.fim)) return;
    setErro(null);
    setOcupado("conferindo");
    try {
      setRevisao(await api("/cargas/base/revisar", { method: "POST", form: form(arquivo, novo) }));
    } catch (err) {
      setErro(mensagemDe(err));
    } finally {
      setOcupado(null);
    }
  };

  const trocar = () => { setArquivo(null); setRevisao(null); setErro(null); setPeriodo({ inicio: "", fim: "" }); };
  const porCnpj = ehPorCnpj(revisao);
  const resumo = porCnpj ? resumoDaConferenciaPorCnpj(revisao) : null;
  const semLojaCnpj = porCnpj ? textoCnpjsSemLoja(revisao) : null;
  const cadastro = porCnpj ? textoCadastroPorCnpj(revisao) : null;
  const subst = revisao && !porCnpj ? textoDeSubstituicao(revisao.substitui) : null;
  const naoCadastradas = revisao && !porCnpj ? textoLojasNaoCadastradas(revisao.lojasNaoCadastradas) : null;
  const semLojas = revisao && revisao.lojas === 0;

  return (
    <JanelaDeImportacao
      titulo="Enviar base comercial"
      etiqueta="Opcional"
      onFechar={onClose}
      ocupado={!!ocupado}
      anuncio={ocupado === "lendo" ? "Lendo a planilha…" : ocupado === "conferindo" ? "Conferindo o período…" : ocupado === "enviando" ? "Enviando…" : arquivo ? `Arquivo escolhido: ${arquivo.name}` : ""}
      textoPrincipal="Enviar base comercial"
      onPrincipal={enviar}
      principalDesabilitado={!arquivo || !podeEnviar(revisao)}
    >
      <p className="m-0 text-sm text-[var(--text-secondary)]">Vendas por data e hora de cada loja. Mostram os horários de maior movimento e deixam a estimativa dos cenários mais precisa. Sem elas, o Diagnóstico usa o faturamento cadastrado na loja.</p>
      <AvisoCaixa tom="info">Se você enviar de novo para a mesma loja, a nova planilha substitui a anterior, que fica no histórico.</AvisoCaixa>
      <PassoNumerado
        numero={1}
        titulo="Baixe a planilha modelo"
        descricao="Colunas: Código da loja, Data, Hora e Valor das vendas."
        acao={<Botao tipo="secundario" onClick={() => baixarArquivo("/planilha-modelo-base", "modelo-base-comercial.xlsx")} disabled={!!ocupado}><IconeDownload />Baixar modelo</Botao>}
      />
      <PassoNumerado numero={2} titulo="Preencha e salve" descricao="Uma planilha pode ter várias lojas: cada linha vai para a loja do código informado." />
      <PassoNumerado numero={3} titulo="Envie a planilha" descricao="Aceitamos .xlsx e .csv.">
        {erro && <div className="mb-3"><AvisoCaixa tom="erro">{erro}</AvisoCaixa></div>}
        {ocupado === "lendo" ? (
          <Progresso texto="Lendo a planilha…" />
        ) : arquivo && revisao ? (
          <div className="flex flex-col gap-3">
            <QuadroDoArquivo nome={arquivo.name} apoio={apoioDaBase({ bytes: arquivo.size, lojas: revisao.lojas, periodo: revisao.periodo })} onTrocar={trocar} desabilitado={ocupado === "enviando" || ocupado === "conferindo"} />
            {ocupado === "enviando" && <Progresso texto="Enviando…" />}
            {porCnpj && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1 text-sm font-bold text-[var(--text-strong)]">
                    Período do arquivo: de
                    <input type="date" value={periodo.inicio} onChange={(e) => mudarPeriodo({ ...periodo, inicio: e.target.value })} disabled={!!ocupado} className={`${entrada} font-normal`} />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-bold text-[var(--text-strong)]">
                    até
                    <input type="date" value={periodo.fim} onChange={(e) => mudarPeriodo({ ...periodo, fim: e.target.value })} disabled={!!ocupado} className={`${entrada} font-normal`} />
                  </label>
                </div>
                {ocupado === "conferindo" && <Progresso texto="Conferindo o período…" />}
                {revisao.erroPeriodo && <AvisoCaixa tom="erro">{revisao.erroPeriodo}</AvisoCaixa>}
                <AvisoCaixa tom="info">{textoDoPeriodoPorCnpj(revisao)}</AvisoCaixa>
                {!revisao.precisaPeriodo && resumo && <AvisoCaixa tom="info" titulo={resumo.titulo}>{resumo.apoio}</AvisoCaixa>}
                {semLojaCnpj && <AvisoCaixa tom="atencao">{semLojaCnpj}</AvisoCaixa>}
                {!revisao.precisaPeriodo && cadastro && <AvisoCaixa tom="info">{cadastro}</AvisoCaixa>}
                {!revisao.precisaPeriodo && revisao.avisos?.length > 0 && (
                  <AvisoCaixa tom="atencao" titulo="Para conferir. Nada disso impede o envio.">
                    <ul className="m-0 mt-1 list-disc pl-5">{revisao.avisos.map((a) => <li key={a.tipo}>{textoDoAviso(a)}</li>)}</ul>
                  </AvisoCaixa>
                )}
              </div>
            )}
            {subst && <AvisoCaixa tom="atencao" titulo={subst.titulo}>{subst.apoio}</AvisoCaixa>}
            {naoCadastradas && <AvisoCaixa tom="atencao">{naoCadastradas}</AvisoCaixa>}
            {revisao.totalErros > 0 && (
              <AvisoCaixa tom="atencao" titulo={`${plural(revisao.totalErros, "linha com problema", "linhas com problema")}. ${revisao.totalErros === 1 ? "Ela não será gravada" : "Elas não serão gravadas"}.`}>
                <ul className="m-0 mt-1 list-disc pl-5">{revisao.erros.slice(0, 3).map((e, i) => <li key={i}>{linhaDeErro({ aba: "", linha: e.linha, motivo: e.motivo }).replace(/^linha/, "Linha")}</li>)}</ul>
              </AvisoCaixa>
            )}
            {semLojas && <AvisoCaixa tom="erro">{porCnpj ? "Nenhum CNPJ do arquivo tem loja cadastrada. Confira os CNPJs na planilha." : "Nenhuma loja do arquivo está cadastrada. Confira o código da loja na planilha."}</AvisoCaixa>}
          </div>
        ) : (
          <AreaDeEnvio onArquivo={escolher} desabilitado={!!ocupado} />
        )}
      </PassoNumerado>
    </JanelaDeImportacao>
  );
}
