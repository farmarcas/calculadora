import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import type { SimulacoesRepository } from '../simulacoes/simulacoes.repository.js';
import { AfdInvalidoError, lerAfd, type BatidaAfd } from './afd.js';
import {
  hashArquivo,
  type ImportacaoRepository,
  type NovaBatida,
} from './importacao.repository.js';
import { soDigitos } from './util.js';

export type ResultadoArquivo = {
  arquivo: string;
  status: 'processado' | 'com_pendencias' | 'rejeitado';
  periodo: { inicio: string; fim: string } | null;
  aceitas: number;
  repetidas: number;
  pendentes: number;
  semNovidades: boolean;
  motivoRejeicao: string | null;
  avisos: string[];
};

// 0 = segunda … 6 = domingo
export const diaDaSemana = (data: string) => {
  const [a, m, d] = data.split('-').map(Number) as [number, number, number];
  return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
};

export const makeImportacaoService = (
  repo: ImportacaoRepository,
  simulacoes: SimulacoesRepository,
  auditar: Auditor,
) => {
  const loja = async (id: string) => {
    const l = await repo.loja(id);
    if (!l) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    return l;
  };

  return {
    // Gerenciar só existe com simulação em uso (RN-E14).
    async exigirEmUso(lojaId: string) {
      await loja(lojaId);
      const emUso = await simulacoes.emUso(lojaId);
      if (!emUso)
        throw new ConflictError(
          'Gerenciar exige uma simulação em uso. Aprove uma simulação antes de importar o ponto.',
          'SEM_SIMULACAO_EM_USO',
        );
      return emUso;
    },

    async importar(
      lojaId: string,
      arquivos: { nome: string; buffer: Buffer }[],
      perfil: string,
    ): Promise<ResultadoArquivo[]> {
      const l = await loja(lojaId);
      const emUso = await this.exigirEmUso(lojaId);
      const pessoas = await repo.pessoasPorCpf();
      const vigencia = emUso.vigenciaInicio?.toISOString().slice(0, 10) ?? '0000-00-00';
      const planejado = new Set(emUso.turnos.map((t) => `${t.matricula}|${t.dia}`));
      const resultados: ResultadoArquivo[] = [];

      for (const a of arquivos) {
        const hash = hashArquivo(a.buffer);
        const rejeitar = async (
          motivo: string,
          cnpj: string | null = null,
        ): Promise<ResultadoArquivo> => {
          await repo.gravar(
            {
              lojaId,
              arquivo: a.nome,
              hash,
              cnpj,
              periodoInicio: null,
              periodoFim: null,
              autor: perfil,
              status: 'REJEITADO',
              motivoRejeicao: motivo,
              aceitas: 0,
              repetidas: 0,
              pendentes: 0,
            },
            [],
          );
          await auditar({
            acao: 'ponto.rejeitado',
            perfil,
            alvoTipo: 'loja',
            alvoId: lojaId,
            detalhe: { arquivo: a.nome },
          });
          return {
            arquivo: a.nome,
            status: 'rejeitado',
            periodo: null,
            aceitas: 0,
            repetidas: 0,
            pendentes: 0,
            semNovidades: false,
            motivoRejeicao: motivo,
            avisos: [],
          };
        };

        let lido;
        try {
          lido = lerAfd(a.buffer);
        } catch (e) {
          if (e instanceof AfdInvalidoError) {
            resultados.push(await rejeitar(`Arquivo inválido: ${e.message}`));
            continue;
          }
          throw e;
        }

        // CNPJ do arquivo → precisa ser desta loja; de outra loja do grupo ou de fora é recusado.
        const cnpjArquivo = lido.cabecalho.cnpj;
        if (soDigitos(l.cnpj ?? '') !== cnpjArquivo) {
          const dona = await repo.lojaDoCnpj(cnpjArquivo);
          const motivo = !l.cnpj
            ? 'A loja não tem CNPJ cadastrado: cadastre o CNPJ em Cadastros para importar o ponto.'
            : dona
              ? `Este arquivo é da loja ${dona.codigo} · ${dona.nome}. Importe nela.`
              : 'O CNPJ do arquivo não pertence a nenhuma loja do grupo.';
          resultados.push(await rejeitar(motivo, cnpjArquivo));
          continue;
        }

        const { dataInicial, dataFinal } = lido.cabecalho;
        const existentes = await repo.chavesExistentes(lojaId, dataInicial, dataFinal);
        const vistas = new Set<string>();
        const novas: NovaBatida[] = [];
        let repetidas = 0;

        const classificar = (b: BatidaAfd): NovaBatida => {
          const pessoa = pessoas.get(b.cpf);
          let situacao: NovaBatida['situacao'] = 'OK';
          let motivo: string | null = null;
          if (!pessoa) {
            situacao = 'PENDENTE';
            motivo = 'cpf_desconhecido';
          } else if (pessoa.lojaId !== lojaId) {
            situacao = 'PENDENTE';
            motivo = 'sem_lotacao';
          } else if (
            b.data >= vigencia &&
            !planejado.has(`${pessoa.matricula}|${diaDaSemana(b.data)}`)
          ) {
            situacao = 'PENDENTE';
            motivo = 'dia_sem_escala';
          }
          return {
            cpf: b.cpf,
            data: b.data,
            minuto: b.minuto,
            nsr: b.nsr,
            situacao,
            motivoPendencia: motivo,
            matricula: situacao === 'OK' ? pessoa!.matricula : null,
          };
        };

        for (const b of lido.batidas) {
          const k = `${b.cpf}|${b.data}|${b.minuto}`;
          if (existentes.has(k) || vistas.has(k)) {
            repetidas++;
            continue;
          }
          vistas.add(k);
          novas.push(classificar(b));
        }
        const pendentes = novas.filter((n) => n.situacao === 'PENDENTE').length;
        const aceitas = novas.length - pendentes;
        const avisos = [...lido.avisos];
        if (await repo.hashJaImportado(lojaId, hash))
          avisos.push('Este mesmo arquivo já tinha sido enviado antes.');

        await repo.gravar(
          {
            lojaId,
            arquivo: a.nome,
            hash,
            cnpj: cnpjArquivo,
            periodoInicio: dataInicial,
            periodoFim: dataFinal,
            autor: perfil,
            status: pendentes > 0 ? 'COM_PENDENCIAS' : 'PROCESSADO',
            motivoRejeicao: null,
            aceitas,
            repetidas,
            pendentes,
          },
          novas,
        );
        await auditar({
          acao: 'ponto.importado',
          perfil,
          alvoTipo: 'loja',
          alvoId: lojaId,
          detalhe: { arquivo: a.nome, aceitas, repetidas, pendentes },
        });
        resultados.push({
          arquivo: a.nome,
          status: pendentes > 0 ? 'com_pendencias' : 'processado',
          periodo: { inicio: dataInicial, fim: dataFinal },
          aceitas,
          repetidas,
          pendentes,
          semNovidades: novas.length === 0,
          motivoRejeicao: null,
          avisos,
        });
      }
      return resultados;
    },

    async log(lojaId: string, pagina: number) {
      await loja(lojaId);
      const { data, total } = await repo.listar(lojaId, pagina, 20);
      return {
        data: data.map((i) => ({
          id: i.id,
          arquivo: i.arquivo,
          status: i.status.toLowerCase(),
          periodo:
            i.periodoInicio && i.periodoFim
              ? {
                  inicio: i.periodoInicio.toISOString().slice(0, 10),
                  fim: i.periodoFim.toISOString().slice(0, 10),
                }
              : null,
          aceitas: i.batidasAceitas,
          repetidas: i.batidasRepetidas,
          pendentes: i.batidasPendentes,
          motivoRejeicao: i.motivoRejeicao,
          autor: i.autor,
          criadoEm: i.criadoEm,
        })),
        meta: { page: pagina, pageSize: 20, total },
      };
    },
  };
};
export type ImportacaoService = ReturnType<typeof makeImportacaoService>;
