import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso } from "../../components/ui/index.jsx";
import LinhaDeCenario from "./cartao/LinhaDeCenario.jsx";
import { diasDasAbas, sugerirTurnosDasVagas, turnosParaGravar } from "../simulacao/escala/escala-regras.js";
import { palavraDaRegua } from "../regua.js";

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

// Os três cenários em linhas (Equilíbrio, Manter horários, Sem contratações) para a regra escolhida, sem valores em reais:
// o horário, o que contratar e a variação de venda e de custo de pessoal em %. As linhas vêm prontas do servidor, iguais
// para dono, gestor e consulta. Nenhum cenário vem destacado como sugerido.
export default function Comparativo({ comparativo, cenarios, lojaId, podeEscrever, onSimular }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);
  if (!comparativo) return null;
  const linhas = cenarios?.linhas ?? [];
  const dono = comparativo.cenarios?.[0]?.custoFolhaMensal !== undefined;
  const antes = cenarios?.manter?.horarioSemana ?? [];

  const personalizar = async (c) => {
    setErro(null);
    setOcupado(true);
    try {
      const corpo = { nome: c.nome.slice(0, 80), regra: cenarios.regra.id };
      let s;
      let aviso = null;
      try {
        s = await api(`/lojas/${lojaId}/simulacoes`, { method: "POST", body: { ...corpo, origem: "escala_atual" } });
      } catch (e) {
        // Nenhum funcionário com horário no Cadastro: a simulação parte do quadro do Cadastro, sem horários.
        if (e.code !== "SEM_HORARIO_NO_CADASTRO") throw e;
        s = await api(`/lojas/${lojaId}/simulacoes`, { method: "POST", body: { ...corpo, origem: "vazia" } });
        aviso = "Esta loja ainda não tem funcionários com horário no Cadastro: a simulação parte do quadro do Cadastro, sem horários. Contratações, horários e impacto já funcionam; para ver a cobertura de quem já trabalha, cadastre o horário dos funcionários em Cadastros › Equipe.";
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
      const gravada = vagas.length || horarios ? await api(`/simulacoes/${s.id}`, { method: "PUT", body: { ...(vagas.length ? { vagas } : {}), ...(horarios ? { horarios } : {}) } }) : s;
      // As contratações já chegam com turnos sobre as horas sem cobertura (spec 040), calculados com o horário do cenário.
      // Se esta segunda gravação falhar, a simulação abre mesmo assim: "Sugerir turno" faz o mesmo na escala.
      if (vagas.length) {
        try {
          const novos = sugerirTurnosDasVagas({ quadro: gravada.quadro, turnos: gravada.turnos, cobertura: gravada.avaliacao?.cobertura, abas: diasDasAbas(gravada.diasAbertos), regra: gravada.regraInfo });
          if (novos.length) await api(`/simulacoes/${s.id}`, { method: "PUT", body: { turnos: turnosParaGravar([...gravada.turnos, ...novos]) } });
        } catch {
          /* segue sem os turnos sugeridos */
        }
      }
      onSimular?.(s.id, aviso);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const podePersonalizar = podeEscrever && !!lojaId && !!cenarios?.regra;

  return (
    <section aria-label="Cenários" className="linhas-conteiner flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-xl leading-[26px] font-bold text-[var(--text-strong)]">Cenários</h2>
        <p className="mt-1 mb-0 text-sm leading-5 text-[var(--text-secondary)]">
          Estimativas para a regra de {cenarios?.regra?.nome ?? "referência"}, com o quadro{dono ? ", os salários" : ""} e a base comercial importados. Cada hora nova de funcionamento vale, por estimativa, 50% da {palavraDaRegua(comparativo.regua)} da hora vizinha. As variações são em relação ao horário e ao custo de pessoal de hoje. Nada altera o cadastro.
        </p>
      </div>
      {erro && <Aviso>{erro}</Aviso>}
      {comparativo.lojaCobreTudo ? (
        <p className="m-0 rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 text-sm leading-5 text-[var(--text-strong)]" data-testid="cobre-tudo">
          A equipe atual cobre todos os dias. Não há o que contratar nem reduzir.
        </p>
      ) : (
        <div role="group" aria-label="Lista de cenários" className="overflow-hidden rounded-card border border-[var(--border-subtle)] shadow-card">
          <div aria-hidden="true" className="linha-cabecalho bg-[var(--surface-subtle)] py-3 text-[11px] leading-4 font-bold tracking-wide text-[var(--neutral-mid-300)]">
            <span>CENÁRIO</span>
            <span>CONTRATAR</span>
            <span>HORÁRIO</span>
            <span>VENDA</span>
            <span>CUSTO DE PESSOAL</span>
            <span />
          </div>
          {linhas.map((l) => (
            <LinhaDeCenario
              key={l.id}
              linha={l}
              antes={antes}
              dono={dono}
              podeEscrever={podePersonalizar}
              ocupado={ocupado}
              onPersonalizar={() => personalizar(l)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
