import { useRef, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso } from "../../components/ui/index.jsx";
import CartaoCenario, { avisosDoCartao, temAvisos } from "./cartao/CartaoCenario.jsx";
import PainelDias from "./cartao/PainelDias.jsx";
import { linhasDoHorario, totaisDaSemana } from "./cartao/cartao-regras.js";

// Quantas linhas o cartão tem na grade compartilhada: título (com a frase do cenário), resultado, status, contratações,
// horas ociosas, horário e botão; e, só quando algum cartão tem avisos, a linha de avisos.
const FAIXAS = 7;

// As vagas do cenário para o simulador: inteiras na jornada cheia e o parcial com as horas dele (a vaga pede 4 a 44 h inteiras).
const vagasDeCenario = (c) =>
  c.contratacoes.flatMap((x) => {
    const parcialH = x.parcial?.horas ?? 0;
    const cheia = x.inteiras > 0 ? Math.round((x.horasContratadas - parcialH) / x.inteiras) : 0;
    const limite = (h) => Math.min(44, Math.max(4, Math.round(h)));
    return [
      ...Array.from({ length: x.inteiras }, () => ({ funcao: x.funcao, cargaH: limite(cheia) })),
      ...(parcialH > 0 ? [{ funcao: x.funcao, cargaH: limite(parcialH) }] : []),
    ];
  });

// Os cenários 1, 2 e 3 lado a lado para a regra escolhida (sempre três, na ordem e com os nomes de sempre). Cada linha do
// cartão fica na mesma altura nos três (grade com subgrid). Só o dono recebe os valores em reais e o cenário sugerido.
export default function Comparativo({ comparativo, cenarios, lojaId, podeEscrever, onSimular }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);
  const [painel, setPainel] = useState(null); // { c, posicao, linhas, totais, gatilho }
  const comparativoRef = useRef(null);
  if (!comparativo) return null;
  const { cenarios: colunas, destaque } = comparativo;
  // O selo "Cenário sugerido" pode ir a outro cenário que não o de menor custo (quando este deixa falta de cobertura).
  const sugeridoId = comparativo.sugerido !== undefined ? comparativo.sugerido : destaque;
  const dono = colunas[0].custoFolhaMensal !== undefined;
  const antes = cenarios?.manter?.horarioSemana ?? [];
  const novosDe = (c) => cenarios?.[c.id]?.horarioSemana ?? antes;

  const avisos = colunas.map((c) => avisosDoCartao(c, { dono }));
  const algumAviso = avisos.some(temAvisos);
  const faixas = FAIXAS + (algumAviso ? 1 : 0);

  const personalizar = async (c, n) => {
    setErro(null);
    setOcupado(true);
    try {
      const corpo = { nome: `Cenário ${n}: ${c.nome}`.slice(0, 80), regra: cenarios.regra.id };
      let s;
      let aviso = null;
      try {
        s = await api(`/lojas/${lojaId}/simulacoes`, { method: "POST", body: { ...corpo, origem: "escala_atual" } });
      } catch (e) {
        // Sem escala importada: a simulação parte do quadro do Cadastro, sem turnos.
        if (!/Importe a escala atual/.test(e.message)) throw e;
        s = await api(`/lojas/${lojaId}/simulacoes`, { method: "POST", body: { ...corpo, origem: "vazia" } });
        aviso = "Esta loja ainda não tem escala importada: a simulação parte do quadro do Cadastro, sem turnos. Contratações, horários e impacto já funcionam; para montar a escala, importe a planilha em Enviar planilhas.";
      }
      const vagas = vagasDeCenario(c);
      // A simulação já nasce com as contratações e os horários do cenário clicado (o Cenário 1 mantém o horário do Cadastro).
      const cadastro = s.resultado?.horario?.cadastro;
      const horarios = c.ajustes?.length && cadastro?.length === 7
        ? { versao: 2, dias: cadastro.map((h, i) => {
            const aj = c.ajustes.find((a) => a.dia === i);
            if (aj) return aj.depois ? { aberta: true, abre: aj.depois.abre, fecha: aj.depois.fecha } : { aberta: false };
            return h.aberta ? { aberta: true, abre: h.abre, fecha: h.fecha } : { aberta: false };
          }) }
        : null;
      if (vagas.length || horarios) await api(`/simulacoes/${s.id}`, { method: "PUT", body: { ...(vagas.length ? { vagas } : {}), ...(horarios ? { horarios } : {}) } });
      setPainel(null);
      onSimular?.(s.id, aviso);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const abrirPainel = (c, posicao, gatilho) => setPainel({ c, posicao, linhas: linhasDoHorario(novosDe(c), antes), totais: totaisDaSemana(novosDe(c), antes), gatilho });
  const podePersonalizar = podeEscrever && !!lojaId && !!cenarios?.regra;

  return (
    <section ref={comparativoRef} aria-label="Cenários sugeridos" className="cenarios-conteiner flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-xl leading-[26px] font-bold text-[var(--text-strong)]">Cenários sugeridos</h2>
        <p className="mt-1 mb-0 text-sm leading-5 text-[var(--text-secondary)]">
          Estimativas para a regra de {cenarios?.regra?.nome ?? "referência"}, com o quadro{dono ? ", os salários" : ""} e a base comercial importados. Cada hora nova de funcionamento vale, por estimativa, 50% da venda da hora vizinha. Nada altera o cadastro.
        </p>
      </div>
      {erro && <Aviso>{erro}</Aviso>}
      {comparativo.lojaCobreTudo ? (
        <p className="m-0 rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 text-sm leading-5 text-[var(--text-strong)]" data-testid="cobre-tudo">
          A equipe atual cobre todos os dias. Não há o que contratar nem reduzir.
        </p>
      ) : (
        <div className="cenarios-grade" style={{ "--colunas": colunas.length }}>
          {colunas.map((c, i) => (
            <CartaoCenario
              key={c.id}
              posicao={i + 1}
              c={c}
              antes={antes}
              novos={novosDe(c)}
              sugerido={sugeridoId === c.id}
              dono={dono}
              ehReferencia={c.id === "manter"}
              faixas={faixas}
              avisos={avisos[i]}
              mostrarAvisos={algumAviso}
              podeEscrever={podePersonalizar}
              ocupado={ocupado}
              onPersonalizar={() => personalizar(c, i + 1)}
              onAbrirPainel={(e) => abrirPainel(c, i + 1, e.currentTarget)}
            />
          ))}
        </div>
      )}
      {painel && <PainelDias painel={painel} onFechar={() => setPainel(null)} onPersonalizar={() => personalizar(painel.c, painel.posicao)} podePersonalizar={podePersonalizar} ocupado={ocupado} />}
    </section>
  );
}
