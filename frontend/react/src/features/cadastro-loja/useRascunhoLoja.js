import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { marcarAlteracoes } from "./guardaSaida.js";

const BLOCOS = ["loja", "configuracao", "custos"];
const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// Campos que mudaram entre o salvo e o rascunho: um por chave de cada bloco (horários e faturamento contam como um).
export const diferencas = (salvo, rascunho) =>
  BLOCOS.flatMap((b) => {
    if (!salvo[b] || !rascunho[b]) return [];
    return Object.keys(rascunho[b]).filter((k) => !k.startsWith("_") && !igual(salvo[b][k], rascunho[b][k])).map((k) => `${b}.${k}`);
  });

// Rascunho único da loja: as abas Dados e funcionamento e Regras e custos mexem nele; um só "Salvar alterações" grava tudo.
// Cada bloco entra quando a aba o carrega (`registrar`); sem isso ele não conta como alteração.
export default function useRascunhoLoja(lojaId, { aoSalvar, paraApi } = {}) {
  const [salvo, setSalvo] = useState({});
  const [rascunho, setRascunho] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const ultima = useRef(lojaId);

  // Trocar de loja começa do zero.
  useEffect(() => {
    if (ultima.current !== lojaId) {
      ultima.current = lojaId;
      setSalvo({});
      setRascunho({});
      setErro(null);
    }
  }, [lojaId]);

  const registrar = useCallback((bloco, valor) => {
    setSalvo((s) => (s[bloco] ? s : { ...s, [bloco]: valor }));
    setRascunho((r) => (r[bloco] ? r : { ...r, [bloco]: valor }));
  }, []);

  const alterar = useCallback((bloco, parte) => {
    setRascunho((r) => ({ ...r, [bloco]: { ...(r[bloco] ?? {}), ...parte } }));
  }, []);

  const mudancas = useMemo(() => diferencas(salvo, rascunho), [salvo, rascunho]);
  useEffect(() => {
    marcarAlteracoes(mudancas.length);
    return () => marcarAlteracoes(0);
  }, [mudancas.length]);

  const cancelar = useCallback(() => {
    setRascunho(salvo);
    setErro(null);
  }, [salvo]);

  const salvar = useCallback(async () => {
    if (!mudancas.length) return null;
    const corpo = {};
    for (const b of BLOCOS) {
      const parte = Object.fromEntries(Object.keys(rascunho[b] ?? {}).filter((k) => mudancas.includes(`${b}.${k}`)).map((k) => [k, rascunho[b][k]]));
      if (Object.keys(parte).length) corpo[b] = paraApi?.[b] ? paraApi[b](parte, rascunho[b]) : parte;
    }
    setSalvando(true);
    setErro(null);
    try {
      const r = await api(`/lojas/${lojaId}/painel`, { method: "PUT", body: corpo });
      setSalvo(rascunho);
      aoSalvar?.(r);
      return r;
    } catch (e) {
      setErro(e.details?.length ? `${e.message} ${e.details.slice(0, 3).map((d) => d.texto ?? d.message ?? "").join(" ")}`.trim() : e.message);
      return null;
    } finally {
      setSalvando(false);
    }
  }, [lojaId, mudancas, rascunho, aoSalvar, paraApi]);

  return { salvo, rascunho, registrar, alterar, mudancas, salvando, erro, setErro, cancelar, salvar };
}
