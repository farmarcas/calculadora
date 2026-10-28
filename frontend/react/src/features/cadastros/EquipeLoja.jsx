import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Campo, Ficha, entrada } from "../../components/ui/index.jsx";
import { NOMES_DIA } from "./HorarioSemana.jsx";

const FUNCOES = ["Farmacêutico", "Atendimento", "Caixa", "Apoio", "Perfumaria"];
// Cargas mensais que o motor de regras entende (÷5 = semanal): 220 = 44h, 210 = 42h, 200 = 40h.
const CARGAS_CONHECIDAS = [220, 210, 200];
const DIAS_PADRAO = [0, 1, 2, 3, 4];

const vazio = { matricula: "", nome: "", cargo: "", funcaoEscala: "", cargaMensalH: "", cpf: "", entrada: "", saida: "", dias: DIAS_PADRAO };
const paraEdicao = (f) => ({
  matricula: f.matricula, nome: f.nome, cargo: f.cargo ?? "", funcaoEscala: f.funcaoEscala ?? "",
  cargaMensalH: f.cargaMensalH ?? "", cpf: f.cpf ?? "", entrada: f.entrada ?? "", saida: f.saida ?? "", dias: f.dias?.length ? f.dias : [],
});

const dadosParaApi = (v, lojaId, novo) => {
  const b = { matricula: v.matricula, nome: v.nome, lojaId, funcaoEscala: v.funcaoEscala || null };
  if (v.cargo) b.cargo = v.cargo;
  if (v.cpf) b.cpf = v.cpf;
  if (v.cargaMensalH) b.cargaMensalH = Number(v.cargaMensalH);
  // Ao editar, entrada e saída em branco limpam o horário.
  if (v.entrada || v.saida || !novo) { b.entrada = v.entrada || null; b.saida = v.saida || null; }
  b.dias = v.dias;
  return b;
};

const horario = (f) => (f.entrada && f.saida ? `${f.entrada}–${f.saida}` : "—");
const resumoDias = (dias = []) => (dias.length ? dias.map((d) => NOMES_DIA[d].slice(0, 3)).join(" ") : "—");

// A equipe da loja, no mesmo lugar da configuração da loja. Salva na hora, sem o botão Salvar da loja.
export default function EquipeLoja({ lojaId, podeEscrever }) {
  const [lista, setLista] = useState(null);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState("");
  const [edicao, setEdicao] = useState(null); // { id?, v }
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const q = new URLSearchParams({ lojaId, pageSize: "100", ...(busca ? { busca } : {}) });
      const r = await api(`/funcionarios?${q}`);
      setLista(r.data);
      setTotal(r.meta.total);
    } catch (e) {
      setErro(e.message);
    }
  }, [lojaId, busca]);
  useEffect(() => { carregar(); }, [carregar]);

  const set = (k) => (e) => setEdicao({ ...edicao, v: { ...edicao.v, [k]: e.target.value } });
  const alternarDia = (d) => {
    const dias = edicao.v.dias.includes(d) ? edicao.v.dias.filter((x) => x !== d) : [...edicao.v.dias, d].sort();
    setEdicao({ ...edicao, v: { ...edicao.v, dias } });
  };

  const salvar = async () => {
    setErro(null);
    try {
      await api(edicao.id ? `/funcionarios/${edicao.id}` : "/funcionarios", {
        method: edicao.id ? "PATCH" : "POST",
        body: dadosParaApi(edicao.v, lojaId, !edicao.id),
      });
      setEdicao(null);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };
  const remover = async (f) => {
    if (!window.confirm(`Remover ${f.nome} da equipe? O histórico é preservado.`)) return;
    try {
      await api(`/funcionarios/${f.id}`, { method: "DELETE" });
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  const mensal = Number(edicao?.v.cargaMensalH);
  return (
    <section aria-label="Equipe da loja" className="flex flex-col gap-3 rounded-lg border border-ink-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-sm font-bold">Equipe da loja {lista ? `(${total})` : ""}</h3>
          <p className="m-0 text-xs text-ink-500">Salva na hora, sem precisar do botão Salvar da loja.</p>
        </div>
        <div className="flex items-center gap-2">
          <input className={`${entrada} w-56`} placeholder="Buscar por nome ou cargo" aria-label="Buscar na equipe" value={busca} onChange={(e) => setBusca(e.target.value)} />
          {podeEscrever && !edicao && <Botao onClick={() => setEdicao({ v: vazio })}>Adicionar</Botao>}
        </div>
      </div>
      {erro && <Aviso>{erro}</Aviso>}

      {edicao && (
        <div className="flex flex-col gap-3 rounded-lg bg-surface-subtle p-3" role="group" aria-label={edicao.id ? "Editar funcionário" : "Novo funcionário"}>
          <div className="grid grid-cols-3 gap-3">
            <Campo rotulo="Nome *"><input className={entrada} value={edicao.v.nome} onChange={set("nome")} /></Campo>
            <Campo rotulo="Matrícula *"><input className={entrada} value={edicao.v.matricula} onChange={set("matricula")} /></Campo>
            <Campo rotulo="CPF"><input className={entrada} value={edicao.v.cpf} onChange={set("cpf")} placeholder="000.000.000-00" /></Campo>
            <Campo rotulo="Cargo"><input className={entrada} value={edicao.v.cargo} onChange={set("cargo")} /></Campo>
            <Campo rotulo="Função de escala">
              <select className={entrada} value={edicao.v.funcaoEscala} onChange={set("funcaoEscala")}>
                <option value="">Fora do cálculo</option>
                {FUNCOES.map((f) => <option key={f}>{f}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Carga mensal (h)">
              <input type="number" min={1} max={260} list="cargas-mensais" className={entrada} value={edicao.v.cargaMensalH} onChange={set("cargaMensalH")} />
              <datalist id="cargas-mensais">{CARGAS_CONHECIDAS.map((c) => <option key={c} value={c} />)}</datalist>
            </Campo>
            <Campo rotulo="Entrada atual"><input type="time" className={entrada} value={edicao.v.entrada} onChange={set("entrada")} /></Campo>
            <Campo rotulo="Saída atual"><input type="time" className={entrada} value={edicao.v.saida} onChange={set("saida")} /></Campo>
          </div>
          {mensal > 0 && (
            <p className="m-0 text-xs text-ink-500">
              Equivale a {Math.round(mensal / 5)}h por semana.{!CARGAS_CONHECIDAS.includes(mensal) ? " Fora de 220, 210 e 200 h: não entra nas regras de 44h, 42h e 40h do Diagnóstico." : ""}
            </p>
          )}
          <fieldset className="flex flex-wrap items-center gap-3 border-0 p-0">
            <legend className="mb-1 p-0 text-xs font-medium text-ink-500">Dias trabalhados</legend>
            {NOMES_DIA.map((n, d) => (
              <label key={n} className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={edicao.v.dias.includes(d)} onChange={() => alternarDia(d)} /> {n.slice(0, 3)}
              </label>
            ))}
          </fieldset>
          <p className="m-0 text-xs text-ink-500">O horário só entra na escala atual do Diagnóstico com entrada, saída e dias preenchidos, e dentro do mesmo dia. A escala importada sempre vale mais.</p>
          <div className="flex justify-end gap-2">
            <Botao tipo="texto" onClick={() => { setEdicao(null); setErro(null); }}>Cancelar</Botao>
            <Botao onClick={salvar}>Salvar funcionário</Botao>
          </div>
        </div>
      )}

      {lista && lista.length === 0 && <p className="m-0 text-sm text-ink-500">{busca ? "Ninguém encontrado." : "Nenhum funcionário cadastrado nesta loja."}</p>}
      {lista && lista.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-ink-500">
            <tr><th className="py-1">Nome</th><th>Cargo</th><th>CPF</th><th>Carga mensal</th><th>Entrada–saída</th><th>Dias</th><th /></tr>
          </thead>
          <tbody>
            {lista.map((f) => (
              <tr key={f.id} className="border-t border-ink-100">
                <td className="py-1.5">{f.nome} {!f.funcaoEscala && <Ficha tom="atencao">fora do cálculo</Ficha>}</td>
                <td>{f.cargo || "—"}</td>
                <td>{f.cpf || "—"}</td>
                <td>{f.cargaMensalH ? `${f.cargaMensalH}h` : "—"}</td>
                <td>{horario(f)}</td>
                <td>{resumoDias(f.dias)}</td>
                <td className="text-right">
                  {podeEscrever && (
                    <>
                      <Botao tipo="texto" onClick={() => setEdicao({ id: f.id, v: paraEdicao(f) })}>Editar</Botao>
                      <Botao tipo="texto" onClick={() => remover(f)}>Remover</Botao>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {total > 100 && <p className="m-0 text-xs text-ink-500">Mostrando os 100 primeiros. Use a busca para achar os outros.</p>}
    </section>
  );
}
