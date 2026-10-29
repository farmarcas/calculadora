import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { lerPlanilha } from '../planilhas/leitor.js';
import type { CargasLojasRepository } from './cargas-lojas.repository.js';
import { planejar, type Plano, type Substituir } from './comparar.js';
import { achaAba, lerRelatorio, mapearColunas, type Leitura } from './relatorio.js';

const LIMITE_LISTA = 500;

const planoDe = async (repo: CargasLojasRepository, leitura: Leitura) =>
  planejar(
    leitura,
    await repo.estado(
      [...new Set(leitura.linhas.map((l) => l.geIdentificacao))],
      [...new Set(leitura.linhas.map((l) => l.cnpj))],
    ),
  );

// Contagens por GE e listas (limitadas) do que pede atenção. Nada aqui é gravado.
const resumoDoPlano = (leitura: Leitura, plano: Plano) => {
  const soma = (f: (g: Plano['porGe'][number]) => number) =>
    plano.porGe.reduce((s, g) => s + f(g), 0);
  const comGe = <T>(f: (g: Plano['porGe'][number]) => T[]) =>
    plano.porGe.flatMap((g) => f(g).map((x) => ({ ge: g.identificacao, ...x })));
  const conflitos = comGe((g) => g.atualizar.flatMap((a) => a.conflitos));
  return {
    totalLinhas: leitura.total,
    ignoradasPorStatus: leitura.ignoradasPorStatus,
    pendencias: leitura.pendencias,
    totais: {
      gesNovos: plano.porGe.filter((g) => g.novo).length,
      criar: soma((g) => g.criar.length),
      atualizar: soma((g) => g.atualizar.length),
      semMudanca: soma((g) => g.semMudanca),
      conflitos: conflitos.length,
      rejeitadas: plano.rejeitadas.length,
      foraDoArquivo: soma((g) => g.foraDoArquivo.length),
      saiuDoAtivo: soma((g) => g.saiuDoAtivo.length),
      codigosAjustados: soma((g) => g.atualizar.filter((a) => a.codigo).length),
      avisos: plano.avisos.length,
    },
    porGe: plano.porGe
      .map((g) => ({
        identificacao: g.identificacao,
        nome: g.nome,
        novo: g.novo,
        criar: g.criar.length,
        atualizar: g.atualizar.length,
        semMudanca: g.semMudanca,
        conflitos: g.atualizar.reduce((s, a) => s + a.conflitos.length, 0),
        foraDoArquivo: g.foraDoArquivo.length,
        saiuDoAtivo: g.saiuDoAtivo.length,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    conflitos: conflitos.slice(0, LIMITE_LISTA),
    rejeitadas: plano.rejeitadas.slice(0, LIMITE_LISTA),
    avisos: plano.avisos.slice(0, LIMITE_LISTA),
    foraDoArquivo: comGe((g) => g.foraDoArquivo).slice(0, LIMITE_LISTA),
    saiuDoAtivo: comGe((g) => g.saiuDoAtivo).slice(0, LIMITE_LISTA),
  };
};

export const makeCargasLojasService = (repo: CargasLojasRepository, auditar: Auditor) => ({
  // Passo 1: lê e confere o arquivo; não grava nenhuma loja.
  async conferir(arquivo: string, buffer: Buffer) {
    const abas = await lerPlanilha(buffer, arquivo);
    const aba = achaAba(abas);
    if (!aba) {
      const faltam = mapearColunas(abas[0]!.cabecalhos).faltam;
      throw new ValidationError(
        `O arquivo não está no formato do relatório de lojas. Faltam as colunas: ${faltam.join(', ')}.`,
        [],
      );
    }
    const leitura = lerRelatorio(aba);
    const plano = await planoDe(repo, leitura);
    const id = await repo.criarImportacao(arquivo, leitura);
    return { id, arquivo, ...resumoDoPlano(leitura, plano) };
  },

  // Passo 2: grava. Refaz a conferência com o que existe agora (alguém pode ter mexido entre os dois passos).
  async confirmar(id: string, substituir: Substituir, perfil: string) {
    const imp = await repo.buscarImportacao(id);
    if (!imp) throw new NotFoundError('Carga não encontrada', 'CARGA_NAO_ENCONTRADA');
    if (imp.confirmada)
      throw new ConflictError('Esta carga já foi confirmada', 'CARGA_JA_CONFIRMADA');
    const plano = await planoDe(repo, imp.leitura);
    const resumo = resumoDoPlano(imp.leitura, plano);
    const r = await repo.aplicar(id, plano, substituir, resumo.totais);
    await auditar({
      acao: 'cargaLojas.confirmada',
      perfil,
      alvoTipo: 'importacao',
      alvoId: id,
      detalhe: { arquivo: imp.arquivo, ...r, rejeitadas: plano.rejeitadas.length },
    });
    return {
      id,
      ...r,
      rejeitadas: plano.rejeitadas.length,
      rejeitadasLista: plano.rejeitadas.slice(0, LIMITE_LISTA),
    };
  },
});
