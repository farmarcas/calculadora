import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { diasAbertos, type LojaDiag } from '../escala/diagnostico.js';
import type { EscalaRepository } from '../escala/escala.repository.js';
import { FUNCOES_PADRAO_MINIMO, regraPara, type RegraId } from '../regras/perfis.js';
import { avaliarSimulacao, type PessoaSim, type TurnoSim } from './avaliar.js';
import type {
  Premissas,
  SimulacaoRegistro,
  SimulacoesRepository,
} from './simulacoes.repository.js';

type Cadastro = { funcionariosDaLoja: (lojaId: string) => Promise<PessoaSim[]> };

const NOMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const makeSimulacoesService = (
  repo: SimulacoesRepository,
  lojas: EscalaRepository,
  cadastro: Cadastro,
  auditar: Auditor,
) => {
  const loja = async (id: string): Promise<LojaDiag> => {
    const l = await lojas.lojaParaDiagnostico(id);
    if (!l) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    return l;
  };
  const simulacao = async (id: string) => {
    const s = await repo.buscar(id);
    if (!s) throw new NotFoundError('Simulação não encontrada', 'SIMULACAO_NAO_ENCONTRADA');
    return s;
  };

  // Rascunho usa o cadastro da loja ao vivo; gravada usa as premissas congeladas.
  const contexto = (s: SimulacaoRegistro, l: LojaDiag) => {
    const p: Premissas = s.premissas ?? {
      horarios: l.horarios,
      minimos: { ...FUNCOES_PADRAO_MINIMO, ...(l.minimos ?? {}) },
      convencao8h24: l.convencao8h24,
      regra: s.regra,
    };
    const regra = regraPara(s.regra as RegraId, p.convencao8h24);
    const dias = diasAbertos(p.horarios as LojaDiag['horarios']);
    return { premissas: p, regra, dias };
  };

  const avaliar = (s: SimulacaoRegistro, l: LojaDiag) => {
    const c = contexto(s, l);
    return {
      c,
      avaliacao: avaliarSimulacao({
        regra: c.regra,
        dias: c.dias,
        minimos: c.premissas.minimos,
        quadro: s.quadro,
        turnos: s.turnos,
      }),
    };
  };

  const detalhe = async (s: SimulacaoRegistro) => {
    const l = await loja(s.lojaId);
    const { c, avaliacao } = avaliar(s, l);
    return {
      id: s.id,
      lojaId: s.lojaId,
      nome: s.nome,
      status: s.status,
      regra: s.regra,
      regraInfo: {
        id: c.regra.id,
        nome: c.regra.nome,
        descricao: c.regra.descricao,
        maxDia: c.regra.maxDia,
        teto: c.regra.teto,
        dias: c.regra.dias,
      },
      origemId: s.origemId,
      autor: s.autor,
      criadaEm: s.criadaEm,
      gravadaEm: s.gravadaEm,
      editavel: s.status === 'rascunho',
      diasAbertos: c.dias,
      quadro: s.quadro,
      turnos: s.turnos,
      avaliacao,
    };
  };

  const doEscalaAtual = async (lojaId: string) => {
    const e = await lojas.escalaAtiva(lojaId);
    const ts = e?.turnos.filter((t) => t.funcao) ?? [];
    if (ts.length === 0)
      throw new ValidationError(
        'Importe a escala atual da loja antes de criar a simulação a partir dela.',
      );
    const quadro: PessoaSim[] = ts.map((t) => ({
      matricula: t.matricula,
      nome: t.nome,
      funcao: t.funcao,
      cargaH: t.cargaH,
    }));
    const turnos: TurnoSim[] = ts.flatMap((t) =>
      t.dias.map((dia) => ({
        matricula: t.matricula,
        dia,
        entrada: t.entrada,
        saida: t.saida,
        iniIntervalo: t.iniIntervalo,
        fimIntervalo: t.fimIntervalo,
      })),
    );
    return { quadro, turnos };
  };

  const validarTurnos = (s: SimulacaoRegistro, turnos: TurnoSim[]) => {
    const conhecidos = new Set(s.quadro.map((p) => p.matricula));
    const vistos = new Set<string>();
    for (const t of turnos) {
      if (!conhecidos.has(t.matricula))
        throw new ValidationError(`Pessoa ${t.matricula} não faz parte desta simulação`);
      const k = `${t.matricula}|${t.dia}`;
      if (vistos.has(k))
        throw new ValidationError(`${t.matricula} tem dois turnos em ${NOMES[t.dia]}`);
      vistos.add(k);
    }
  };

  return {
    async listar(lojaId: string, descartadas: boolean) {
      await loja(lojaId);
      return { data: await repo.listar(lojaId, descartadas) };
    },

    async obter(id: string) {
      return detalhe(await simulacao(id));
    },

    async criar(
      lojaId: string,
      b: { nome: string; regra: RegraId; origem: string },
      perfil: string,
    ) {
      await loja(lojaId);
      let base: { quadro: PessoaSim[]; turnos: TurnoSim[] };
      let origemId: string | null = null;
      if (b.origem === 'escala_atual') base = await doEscalaAtual(lojaId);
      else if (b.origem === 'vazia') {
        const quadro = await cadastro.funcionariosDaLoja(lojaId);
        if (quadro.length === 0)
          throw new ValidationError(
            'A loja não tem funcionários com função de escala. Cadastre-os antes.',
          );
        base = { quadro, turnos: [] };
      } else {
        const o = await simulacao(b.origem);
        if (o.lojaId !== lojaId) throw new ValidationError('A simulação de origem é de outra loja');
        base = { quadro: o.quadro, turnos: o.turnos };
        origemId = o.id;
      }
      const s = await repo.criar({
        lojaId,
        nome: b.nome,
        regra: b.regra,
        origemId,
        autor: perfil,
        ...base,
      });
      await auditar({
        acao: 'simulacao.criada',
        perfil,
        alvoTipo: 'simulacao',
        alvoId: s.id,
        detalhe: { origem: b.origem },
      });
      return detalhe(s);
    },

    async editar(
      id: string,
      b: { nome?: string; regra?: RegraId; turnos?: TurnoSim[] },
      perfil: string,
    ) {
      const s = await simulacao(id);
      if (s.status !== 'rascunho')
        throw new ConflictError(
          'Simulação gravada não se edita: clone para ajustar.',
          'SIMULACAO_NAO_EDITAVEL',
        );
      if (b.turnos) validarTurnos(s, b.turnos);
      await repo.atualizarRascunho(id, b);
      if (b.turnos)
        await auditar({ acao: 'simulacao.ajustada', perfil, alvoTipo: 'simulacao', alvoId: id });
      return detalhe(await simulacao(id));
    },

    async gravar(id: string, perfil: string) {
      const s = await simulacao(id);
      if (s.status !== 'rascunho')
        throw new ConflictError('Só rascunho pode ser gravado.', 'SIMULACAO_NAO_EDITAVEL');
      const l = await loja(s.lojaId);
      const { c, avaliacao } = avaliar(s, l);
      if (!avaliacao.podeGravar)
        throw new ValidationError(
          `Não dá para gravar: ${avaliacao.erros.length} erro(s) nas regras.`,
          avaliacao.erros.slice(0, 20),
        );
      await repo.gravar(
        id,
        { ...c.premissas, regra: s.regra },
        { erros: 0, avisos: avaliacao.avisos.length, porPessoa: avaliacao.porPessoa },
      );
      await auditar({ acao: 'simulacao.gravada', perfil, alvoTipo: 'simulacao', alvoId: id });
      return detalhe(await simulacao(id));
    },

    async descartar(id: string, perfil: string) {
      const s = await simulacao(id);
      if (s.status === 'em_uso')
        throw new ConflictError('A simulação em uso não pode ser descartada.', 'SIMULACAO_EM_USO');
      if (s.status === 'descartada') return detalhe(s);
      await repo.mudarStatus(id, 'descartada');
      await auditar({ acao: 'simulacao.descartada', perfil, alvoTipo: 'simulacao', alvoId: id });
      return detalhe(await simulacao(id));
    },

    async clonar(id: string, perfil: string) {
      const o = await simulacao(id);
      const s = await repo.criar({
        lojaId: o.lojaId,
        nome: `${o.nome} (cópia)`.slice(0, 80),
        regra: o.regra,
        origemId: o.id,
        autor: perfil,
        quadro: o.quadro,
        turnos: o.turnos,
      });
      await auditar({
        acao: 'simulacao.clonada',
        perfil,
        alvoTipo: 'simulacao',
        alvoId: s.id,
        detalhe: { origem: o.id },
      });
      return detalhe(s);
    },
  };
};
