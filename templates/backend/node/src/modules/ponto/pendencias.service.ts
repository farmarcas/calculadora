import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import type { SimulacoesRepository } from '../simulacoes/simulacoes.repository.js';
import { diaDaSemana } from './importacao.service.js';
import type { PendenciasRepository } from './pendencias.repository.js';
import { mascararCpf, soDigitos } from './util.js';

const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export const makePendenciasService = (
  repo: PendenciasRepository,
  simulacoes: SimulacoesRepository,
  auditar: Auditor,
) => {
  const pendente = async (lojaId: string, id: string) => {
    const p = await repo.pendente(lojaId, id);
    if (!p)
      throw new NotFoundError(
        'Pendência não encontrada ou já resolvida',
        'PENDENCIA_NAO_ENCONTRADA',
      );
    return p;
  };
  const pessoaDaLoja = async (lojaId: string, matricula: string) => {
    const f = await repo.funcionario(matricula);
    if (!f || f.lojaId !== lojaId)
      throw new ValidationError('A pessoa não faz parte do quadro desta loja');
    return f;
  };

  return {
    async listar(lojaId: string, motivo: string | undefined, pagina: number) {
      const { data, total } = await repo.listar(lojaId, motivo, pagina, 50);
      const porCpf = await repo.pessoasPorCpf();
      return {
        data: data.map((p) => ({
          id: p.id,
          data: p.data,
          hora: hhmm(p.minuto),
          cpfMascarado: mascararCpf(p.cpf),
          motivo: p.motivoPendencia,
          pessoa: porCpf.get(p.cpf) ?? null,
        })),
        meta: { page: pagina, pageSize: 50, total },
      };
    },

    async vincular(lojaId: string, id: string, matricula: string, perfil: string) {
      await pendente(lojaId, id);
      await pessoaDaLoja(lojaId, matricula);
      await repo.resolver(id, { situacao: 'VINCULADA', matricula, por: perfil });
      await auditar({
        acao: 'ponto.pendencia-vinculada',
        perfil,
        alvoTipo: 'batida',
        alvoId: id,
        detalhe: { matricula },
      });
    },

    async ignorar(lojaId: string, id: string, motivo: string, perfil: string) {
      await pendente(lojaId, id);
      await repo.resolver(id, { situacao: 'IGNORADA', motivoIgnorar: motivo, por: perfil });
      await auditar({
        acao: 'ponto.pendencia-ignorada',
        perfil,
        alvoTipo: 'batida',
        alvoId: id,
        detalhe: { motivo },
      });
    },

    // Dia sem escala: a pessoa trabalhou mesmo assim e o gestor confirma. Entra na apuração como trabalho em folga.
    async confirmarFolga(lojaId: string, id: string, perfil: string) {
      const p = await pendente(lojaId, id);
      if (p.motivoPendencia !== 'dia_sem_escala')
        throw new ConflictError(
          'Só batida em dia sem escala pode ser confirmada como trabalho em folga.',
          'PENDENCIA_NAO_E_FOLGA',
        );
      const pessoa = (await repo.pessoasPorCpf()).get(p.cpf);
      if (!pessoa)
        throw new ConflictError('A pessoa deste CPF não está cadastrada.', 'PESSOA_NAO_ENCONTRADA');
      await repo.resolver(id, { situacao: 'VINCULADA', matricula: pessoa.matricula, por: perfil });
      await auditar({
        acao: 'ponto.folga-confirmada',
        perfil,
        alvoTipo: 'batida',
        alvoId: id,
        detalhe: { matricula: pessoa.matricula },
      });
    },

    // Grava o CPF que faltava na pessoa e resolve de uma vez as pendências daquele CPF.
    async cadastrarCpf(lojaId: string, cpfInformado: string, matricula: string, perfil: string) {
      const cpf = soDigitos(cpfInformado);
      if (!/^\d{11}$/.test(cpf)) throw new ValidationError('CPF deve ter 11 dígitos');
      await pessoaDaLoja(lojaId, matricula);
      const dono = await repo.donoDoCpf(cpf);
      if (dono && dono.matricula !== matricula)
        throw new ConflictError('Este CPF já está cadastrado para outra pessoa.', 'CPF_DUPLICADO');
      await repo.gravarCpf(matricula, cpf);

      const emUso = await simulacoes.emUso(lojaId);
      const vigencia = emUso?.vigenciaInicio?.toISOString().slice(0, 10) ?? '0000-00-00';
      const planejado = new Set((emUso?.turnos ?? []).map((t) => `${t.matricula}|${t.dia}`));
      let resolvidas = 0;
      let aindaPendentes = 0;
      for (const p of await repo.pendentesDoCpf(lojaId, cpf)) {
        // Sem escala naquele dia continua exigindo uma decisão: confirmar a folga ou ignorar.
        if (p.data >= vigencia && !planejado.has(`${matricula}|${diaDaSemana(p.data)}`)) {
          await repo.resolver(p.id, {
            situacao: 'PENDENTE',
            motivoPendencia: 'dia_sem_escala',
            matricula: null,
            por: perfil,
          });
          aindaPendentes++;
        } else {
          await repo.resolver(p.id, { situacao: 'VINCULADA', matricula, por: perfil });
          resolvidas++;
        }
      }
      await auditar({
        acao: 'ponto.cpf-cadastrado',
        perfil,
        alvoTipo: 'funcionario',
        alvoId: matricula,
        detalhe: { resolvidas, aindaPendentes },
      });
      return { resolvidas, aindaPendentes };
    },
  };
};
export type PendenciasService = ReturnType<typeof makePendenciasService>;
