// Único ponto de contato com o Usersnap. Nenhuma tela importa `@usersnap/browser`.
// Sem chave fica desligado; só carrega depois de a pessoa entrar pelo Radar; qualquer falha daqui é engolida.
// O que aparece na tela (botão de feedback, survey) é cadastrado no painel do Usersnap, não aqui.
import { loadSpace } from "@usersnap/browser";

let chave = "";
let api = null;
let carregando = null;
let iniciado = false;
let atual = null;
let geracao = 0;
let fila = Promise.resolve();

const seguro = (fn) => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};

// Tarefas em sequência: carregar, montar, remontar e desmontar nunca se atropelam.
const enfileirar = (tarefa) => {
  fila = fila.then(tarefa).catch(() => {});
};

const obterApi = () => {
  if (api) return Promise.resolve(api);
  carregando ??= loadSpace(chave).then(
    (a) => {
      api = a;
      return a;
    },
    (erro) => {
      carregando = null;
      throw erro;
    },
  );
  return carregando;
};

export const iniciar = (config = {}) =>
  seguro(() => {
    const env = import.meta.env ?? {};
    chave = String(config.chave ?? env.VITE_USERSNAP_SPACE_KEY ?? "").trim();
    api = null;
    carregando = null;
    iniciado = false;
    atual = null;
    geracao += 1;
    fila = Promise.resolve();
  });

const semVazios = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""));

// Liga o Usersnap à pessoa logada. Repetir os mesmos dados não refaz nada; loja ou pessoa nova remonta.
export const identificar = ({ id, nome, email, perfil, papel_radar, loja } = {}) =>
  seguro(() => {
    if (!chave || id == null || id === "") return;
    const opcoes = {
      user: semVazios({ userId: String(id), email, nome, perfil, papel_radar }),
      custom: semVazios({ loja }),
    };
    const dados = JSON.stringify(opcoes);
    if (dados === atual) return;
    atual = dados;
    const minha = (geracao += 1);
    enfileirar(async () => {
      const a = await obterApi();
      if (minha !== geracao) return;
      if (iniciado) {
        await a.destroy();
        iniciado = false;
        if (minha !== geracao) return;
      }
      await a.init(opcoes);
      iniciado = true;
    });
  });

// Na saída: o widget some e a próxima pessoa não herda nada desta.
export const limpar = () =>
  seguro(() => {
    if (!chave) return;
    atual = null;
    geracao += 1;
    enfileirar(async () => {
      if (!api || !iniciado) return;
      await api.destroy();
      iniciado = false;
    });
  });
