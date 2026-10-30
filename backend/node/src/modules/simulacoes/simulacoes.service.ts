import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { normalizarHorarios } from '../cadastros/horarios.js';
import { calcularResultado } from './resultado.js';
import { diasAbertos, type LojaDiag } from '../escala/diagnostico.js';
import type { EscalaRepository } from '../escala/escala.repository.js';
import { FUNCOES_PADRAO_MINIMO, regraPara, type RegraId } from '../regras/perfis.js';
import { minimosIguais } from '../regras/requisitos.js';
import { exigenciasDaLoja } from '../regras/turnos.js';
import { PARAMETROS_PADRAO, type TabelaParametros } from '../regras/parametros.js';
import { calcularIndicadores, sintese } from './comparar.js';
import { gerarExcelEscala } from './exportar.js';
import { avaliarSimulacao, type PessoaSim, type TurnoSim } from './avaliar.js';
import { aplicarVagasEDesligados, vagasSugeridas, type VagaEntrada } from './vagas.js';
import { calcularCusto } from '../custos/custo.js';
import type { Custos } from '../custos/custos.schemas.js';
import type {
  Premissas,
  SimulacaoRegistro,
  SimulacoesRepository,
} from './simulacoes.repository.js';

type Cadastro = {
  funcionariosDaLoja: (lojaId: string) => Promise<PessoaSim[]>;
  // Situação atual no cadastro de quem está no quadro: a loja onde está lotado e se ainda está ativo.
  situacaoPessoas: (
    matriculas: string[],
  ) => Promise<Map<string, { lojaId: string; ativo: boolean }>>;
};

const NOMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const makeSimulacoesService = (
  repo: SimulacoesRepository,
  lojas: EscalaRepository,
  cadastro: Cadastro,
  auditar: Auditor,
) => {
  // Parâmetros legais em uso (jornada, dias, divisor), lidos junto com a loja a cada pedido.
  let tabela: TabelaParametros = PARAMETROS_PADRAO;
  const loja = async (id: string): Promise<LojaDiag> => {
    const l = await lojas.lojaParaDiagnostico(id);
    if (!l) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    tabela = await lojas.parametrosVigentes();
    return l;
  };
  const simulacao = async (id: string) => {
    const s = await repo.buscar(id);
    if (!s) throw new NotFoundError('Simulação não encontrada', 'SIMULACAO_NAO_ENCONTRADA');
    return s;
  };

  // O retrato guardado traz o salário do momento de gravar; o encargo vem sempre do regime atual da loja
  // (o percentual digitado antes não vale mais).
  const custosDaSimulacao = (retrato: Custos | null | undefined, l: LojaDiag): Custos | null =>
    retrato
      ? { ...retrato, encargosPct: l.custos?.encargosPct ?? retrato.encargosPct }
      : (l.custos ?? null);

  // Rascunho usa o cadastro da loja ao vivo; gravada usa as premissas congeladas.
  const contexto = (s: SimulacaoRegistro, l: LojaDiag) => {
    // O horário simulado (rascunho) vale no lugar do Cadastro; nunca grava na loja.
    const p: Premissas = s.premissas ?? {
      horarios: normalizarHorarios(s.horarios) ?? l.horarios,
      minimos: exigenciasDaLoja({ ...FUNCOES_PADRAO_MINIMO, ...(l.minimos ?? {}) }, l.turnos),
      convencao8h24: l.convencao8h24,
      custos: l.custos ?? null,
      regra: s.regra,
    };
    const regra = regraPara(s.regra as RegraId, p.convencao8h24, tabela);
    const dias = diasAbertos(p.horarios);
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

  // Simulação em uso fica "desatualizada" quando o cadastro da loja mudou depois da aprovação (RN-E10).
  // Nada é alterado automaticamente: só avisa.
  const desatualizacao = async (s: SimulacaoRegistro, l: LojaDiag): Promise<string[]> => {
    if (s.status !== 'em_uso' || !s.premissas) return [];
    const motivos: string[] = [];
    const [atuais, situacao] = await Promise.all([
      cadastro.funcionariosDaLoja(s.lojaId),
      cadastro.situacaoPessoas(s.quadro.map((p) => p.matricula)),
    ]);
    const noQuadro = new Set(s.quadro.map((p) => p.matricula));
    const novos = atuais.filter((p) => !noQuadro.has(p.matricula));
    if (novos.length)
      motivos.push(`Entrou no quadro da loja: ${novos.map((p) => p.nome).join(', ')}.`);
    const sairam = s.quadro.filter((p) => {
      const x = situacao.get(p.matricula);
      return x && (!x.ativo || x.lojaId !== s.lojaId);
    });
    if (sairam.length)
      motivos.push(`Saiu do quadro da loja: ${sairam.map((p) => p.nome).join(', ')}.`);
    // Compara os dois já convertidos: só mudar o formato do cadastro não é mudança de horário.
    if (
      JSON.stringify(normalizarHorarios(l.horarios)) !==
      JSON.stringify(normalizarHorarios(s.premissas.horarios))
    )
      motivos.push('O horário de funcionamento da loja mudou.');
    const min = exigenciasDaLoja({ ...FUNCOES_PADRAO_MINIMO, ...(l.minimos ?? {}) }, l.turnos);
    if (!minimosIguais(min, s.premissas.minimos))
      motivos.push('O mínimo de pessoas por função mudou.');
    if (l.convencao8h24 !== s.premissas.convencao8h24)
      motivos.push('A convenção coletiva (8h24 por dia) mudou.');
    return motivos;
  };

  const detalhe = async (s: SimulacaoRegistro, perfil?: string) => {
    const l = await loja(s.lojaId);
    const { c, avaliacao } = avaliar(s, l);
    const motivosDesatualizada = await desatualizacao(s, l);
    const dono = perfil === 'TENANT_ADMIN';
    const base = await lojas.baseAtiva(s.lojaId);
    const resultado = calcularResultado({
      regraId: s.regra as RegraId,
      regra: c.regra,
      regraAtual: regraPara('atual', c.premissas.convencao8h24, tabela),
      dias: c.dias,
      diasCadastro: diasAbertos(l.horarios),
      minimos: c.premissas.minimos,
      quadro: s.quadro,
      vendas: base?.vendas ?? [],
      custos: custosDaSimulacao(c.premissas.custos, l),
      parametros: tabela,
      dono,
    });
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
      numeroCenario: s.numeroCenario,
      // Número do botão "Salvar como cenário N" (só enquanto é rascunho).
      ...(s.status === 'rascunho'
        ? { proximoNumeroCenario: await repo.proximoNumeroCenario(s.lojaId) }
        : {}),
      autor: s.autor,
      criadaEm: s.criadaEm,
      gravadaEm: s.gravadaEm,
      aprovadaPor: s.aprovadaPor,
      aprovadaEm: s.aprovadaEm,
      vigenciaInicio: s.vigenciaInicio,
      desatualizada: motivosDesatualizada.length > 0,
      motivosDesatualizada,
      editavel: s.status === 'rascunho',
      diasAbertos: c.dias,
      quadro: s.quadro,
      turnos: s.turnos,
      avaliacao,
      resultado,
      // Custo só sai para o dono do grupo: para os outros o campo nem existe.
      ...(perfil === 'TENANT_ADMIN'
        ? {
            custo: calcularCusto({
              regra: s.regra as RegraId,
              quadro: s.quadro,
              // Retrato do momento de gravar; sem valores nele, vale o que a loja informou depois.
              custos: custosDaSimulacao(c.premissas.custos, l),
              parametros: tabela,
            }),
          }
        : {}),
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
      const l = await loja(lojaId);
      const data = await repo.listar(lojaId, descartadas);
      const emUso = await repo.emUso(lojaId);
      const motivos = emUso ? await desatualizacao(emUso, l) : [];
      return {
        data: data.map((x) => ({
          ...x,
          desatualizada: x.status === 'em_uso' && motivos.length > 0,
        })),
      };
    },

    async obter(id: string, perfil: string) {
      return detalhe(await simulacao(id), perfil);
    },

    async criar(
      lojaId: string,
      b: { nome: string; regra: RegraId; origem: string; comVagasSugeridas?: boolean },
      perfil: string,
    ) {
      const l = await loja(lojaId);
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
      if (b.comVagasSugeridas) {
        if (b.origem !== 'escala_atual')
          throw new ValidationError('As contratações sugeridas só valem a partir da escala atual.');
        const regra = regraPara(b.regra, l.convencao8h24, tabela);
        const sugeridas = vagasSugeridas(
          regra,
          diasAbertos(l.horarios),
          exigenciasDaLoja({ ...FUNCOES_PADRAO_MINIMO, ...(l.minimos ?? {}) }, l.turnos),
          base.quadro,
        );
        base = { ...base, ...aplicarVagasEDesligados(base.quadro, base.turnos, sugeridas) };
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
      return detalhe(s, perfil);
    },

    async editar(
      id: string,
      b: {
        nome?: string;
        regra?: RegraId;
        turnos?: TurnoSim[];
        vagas?: VagaEntrada[];
        desligados?: string[];
        horarios?: unknown;
      },
      perfil: string,
    ) {
      const s = await simulacao(id);
      if (s.status !== 'rascunho')
        throw new ConflictError(
          'Simulação gravada não se edita: clone para ajustar.',
          'SIMULACAO_NAO_EDITAVEL',
        );
      let quadro: PessoaSim[] | undefined;
      let turnos = b.turnos;
      if (b.vagas || b.desligados) {
        const r = aplicarVagasEDesligados(s.quadro, b.turnos ?? s.turnos, b.vagas, b.desligados);
        quadro = r.quadro;
        turnos = r.turnos;
        if (r.adicionadas.length)
          await auditar({
            acao: 'simulacao.vaga-adicionada',
            perfil,
            alvoTipo: 'simulacao',
            alvoId: id,
            detalhe: { vagas: r.adicionadas },
          });
        if (r.removidas.length)
          await auditar({
            acao: 'simulacao.vaga-removida',
            perfil,
            alvoTipo: 'simulacao',
            alvoId: id,
            detalhe: { vagas: r.removidas },
          });
        if (b.desligados)
          await auditar({
            acao: 'simulacao.desligamento',
            perfil,
            alvoTipo: 'simulacao',
            alvoId: id,
            detalhe: { total: b.desligados.length },
          });
      }
      if (turnos) validarTurnos({ ...s, quadro: quadro ?? s.quadro }, turnos);
      await repo.atualizarRascunho(id, {
        nome: b.nome,
        regra: b.regra,
        turnos,
        quadro,
        horarios: b.horarios,
      });
      if (b.horarios !== undefined)
        await auditar({
          acao: 'simulacao.horario-ajustado',
          perfil,
          alvoTipo: 'simulacao',
          alvoId: id,
          detalhe: { voltouAoCadastro: b.horarios === null },
        });
      if (b.turnos)
        await auditar({ acao: 'simulacao.ajustada', perfil, alvoTipo: 'simulacao', alvoId: id });
      return detalhe(await simulacao(id), perfil);
    },

    async gravar(id: string, perfil: string, comoCenario = false) {
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
        // Todo cenário salvo ganha um número da loja (1, 2, 3…); só "Salvar como cenário" troca o nome.
        await (async () => {
          const numero = await repo.proximoNumeroCenario(s.lojaId);
          return { numero, nome: comoCenario ? `Cenário ${numero}` : s.nome };
        })(),
      );
      await auditar({ acao: 'simulacao.gravada', perfil, alvoTipo: 'simulacao', alvoId: id });
      return detalhe(await simulacao(id), perfil);
    },

    async aprovar(id: string, vigenciaInicio: string | undefined, perfil: string) {
      const s = await simulacao(id);
      if (s.status !== 'gravada')
        throw new ConflictError('Só simulação gravada pode ser aprovada.', 'SIMULACAO_NAO_GRAVADA');
      const l = await loja(s.lojaId);
      const { avaliacao } = avaliar(s, l);
      if (!avaliacao.podeGravar)
        throw new ValidationError(
          `Não dá para aprovar: ${avaliacao.erros.length} erro(s) nas regras.`,
          avaliacao.erros.slice(0, 20),
        );
      const inicio = vigenciaInicio
        ? new Date(`${vigenciaInicio}T00:00:00.000Z`)
        : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
      const anterior = await repo.emUso(s.lojaId);
      await repo.aprovar(id, s.lojaId, perfil, inicio);
      await auditar({
        acao: 'simulacao.aprovada',
        perfil,
        alvoTipo: 'simulacao',
        alvoId: id,
        detalhe: {
          vigenciaInicio: inicio.toISOString().slice(0, 10),
          substituiu: anterior?.id ?? null,
        },
      });
      return detalhe(await simulacao(id), perfil);
    },

    // Compara 2 a 3 simulações da mesma loja; a em uso entra sempre como referência.
    async comparar(lojaId: string, ids: string[], perfil: string) {
      const l = await loja(lojaId);
      const lista = await Promise.all(ids.map((i) => simulacao(i)));
      if (lista.some((x) => x.lojaId !== lojaId))
        throw new ValidationError('Só dá para comparar simulações da mesma loja');
      if (lista.some((x) => x.status === 'descartada'))
        throw new ValidationError('Simulação descartada não entra na comparação');
      const emUso = await repo.emUso(lojaId);
      const todas = emUso && !lista.some((x) => x.id === emUso.id) ? [emUso, ...lista] : lista;

      const calculadas = todas.map((x) => {
        const { avaliacao } = avaliar(x, l);
        return {
          sim: x,
          ind: calcularIndicadores({
            quadro: x.quadro,
            turnos: x.turnos,
            erros: avaliacao.erros,
            avisos: avaliacao.avisos,
            cobertura: avaliacao.cobertura,
          }),
        };
      });
      const ref = calculadas.find((c) => c.sim.id === emUso?.id) ?? null;
      const dono = perfil === 'TENANT_ADMIN';
      const custoDe = (x: SimulacaoRegistro) =>
        calcularCusto({
          regra: x.regra as RegraId,
          quadro: x.quadro,
          custos: custosDaSimulacao(contexto(x, l).premissas.custos, l),
          parametros: tabela,
        });
      const custoRef = dono && ref ? custoDe(ref.sim) : null;
      const mensalRef = custoRef && custoRef.informado ? custoRef.mensal : null;

      return {
        referenciaId: ref?.sim.id ?? null,
        simulacoes: calculadas.map(({ sim, ind }) => {
          const c = dono ? custoDe(sim) : null;
          const mensal = c && c.informado ? c.mensal : null;
          const diff =
            mensal !== null && mensalRef !== null && sim.id !== ref?.sim.id
              ? Math.round((mensal - mensalRef) * 100) / 100
              : null;
          const vagas = sim.quadro.filter((p) => p.vaga && !p.desligado).length;
          return {
            id: sim.id,
            nome: sim.nome,
            status: sim.status,
            regra: regraPara(sim.regra as RegraId, false, tabela).nome,
            referencia: sim.id === ref?.sim.id,
            podeAprovar: sim.status === 'gravada' && ind.erros === 0,
            indicadores: ind,
            vagas,
            sintese: sintese(
              sim.nome,
              ind,
              ref && ref.sim.id !== sim.id ? ref.ind : null,
              ref?.sim.nome ?? null,
              { custoDiff: diff, vagas },
            ),
            // Só o dono recebe este bloco.
            ...(c ? { custo: { ...c, diferencaMensalFrenteEmUso: diff } } : {}),
          };
        }),
      };
    },

    async exportar(id: string, perfil: string) {
      const s = await simulacao(id);
      const l = await loja(s.lojaId);
      const { c } = avaliar(s, l);
      const buffer = await gerarExcelEscala({
        lojaNome: `${l.codigo} · ${l.nome}`,
        simulacao: {
          nome: s.nome,
          status: s.status,
          regraNome: c.regra.nome,
          vigenciaInicio: s.vigenciaInicio,
        },
        quadro: s.quadro,
        turnos: s.turnos,
      });
      await auditar({
        acao: 'simulacao.exportada',
        perfil,
        alvoTipo: 'simulacao',
        alvoId: id,
        detalhe: { formato: 'xlsx' },
      });
      return {
        buffer,
        nome:
          `escala-${l.codigo}-${s.nome}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+$/, '') + '.xlsx',
      };
    },

    async descartar(id: string, perfil: string) {
      const s = await simulacao(id);
      if (s.status === 'em_uso')
        throw new ConflictError('A simulação em uso não pode ser descartada.', 'SIMULACAO_EM_USO');
      if (s.status === 'descartada') return detalhe(s, perfil);
      await repo.mudarStatus(id, 'descartada');
      await auditar({ acao: 'simulacao.descartada', perfil, alvoTipo: 'simulacao', alvoId: id });
      return detalhe(await simulacao(id), perfil);
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
      return detalhe(s, perfil);
    },
  };
};
