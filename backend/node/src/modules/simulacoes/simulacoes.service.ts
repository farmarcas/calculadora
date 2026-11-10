import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { soNoCalculo } from '../cadastros/funcoes.js';
import { normalizarHorarios } from '../cadastros/horarios.js';
import { calcularResultado } from './resultado.js';
import { diasAbertos, type LojaDiag } from '../escala/diagnostico.js';
import type { EscalaRepository } from '../escala/escala.repository.js';
import { FUNCOES_PADRAO_MINIMO, regraPara, type RegraId } from '../regras/perfis.js';
import { minimosIguais } from '../regras/requisitos.js';
import { exigenciasDaLoja } from '../regras/turnos.js';
import { PARAMETROS_PADRAO, type TabelaParametros } from '../regras/parametros.js';
import { calcularIndicadores, sintese } from './comparar.js';
import { motivosDeDesatualizacao } from './desatualizada.js';
import { nomeDeQuemCriou, tipoDoCenario } from './resumo.js';
import { gerarExcelEscala } from './exportar.js';
import { coberturaDaSimulacao } from './cobertura-simulacao.js';
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
      minimos: exigenciasDaLoja({ ...FUNCOES_PADRAO_MINIMO, ...soNoCalculo(l.minimos) }, l.turnos),
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

  // O resultado de uma simulação (saldo, folha extra, horas abertas…): a mesma conta no painel, na lista e na comparação.
  const resultadoDe = (
    s: SimulacaoRegistro,
    l: LojaDiag,
    vendas: Parameters<typeof calcularResultado>[0]['vendas'],
    dono: boolean,
  ) => {
    const c = contexto(s, l);
    return calcularResultado({
      regraId: s.regra as RegraId,
      regra: c.regra,
      regraAtual: regraPara('atual', c.premissas.convencao8h24, tabela),
      dias: c.dias,
      diasCadastro: diasAbertos(l.horarios),
      minimos: c.premissas.minimos,
      quadro: s.quadro,
      vendas,
      custos: custosDaSimulacao(c.premissas.custos, l),
      parametros: tabela,
      dono,
    });
  };

  // O que a lista e a comparação mostram de cada simulação. Valores em reais só para o dono (o campo nem existe para os outros).
  const resumoDoResultado = (resultado: ReturnType<typeof calcularResultado>, dono: boolean) => ({
    tipo: tipoDoCenario(resultado.horasAbertas, resultado.horasAbertasAntes),
    horasAbertas: resultado.horasAbertas,
    // Margem ou venda: o que mediu a perda, o ganho e o saldo desta simulação (igual para toda a loja).
    regua: resultado.regua,
    ...(dono
      ? {
          saldoMensal: resultado.saldoMensal ?? null,
          folhaExtra: resultado.folhaExtra ?? null,
          vendaEstimada: resultado.vendaEstimada ?? null,
          vendaQueSai: resultado.vendaQueSai ?? null,
        }
      : {}),
  });

  // O que a loja tem hoje, para a regra de "desatualizada": lido uma vez e reaproveitado em todas as simulações.
  const hojeDaLoja = async (l: LojaDiag, lojaId: string, registros: SimulacaoRegistro[]) => {
    const quadroDeHoje = await cadastro.funcionariosDaLoja(lojaId);
    const matriculas = [
      ...new Set(
        registros.filter((x) => x.status === 'gravada').flatMap((x) => x.quadro.map((p) => p.matricula)),
      ),
    ];
    const situacao = matriculas.length ? await cadastro.situacaoPessoas(matriculas) : new Map();
    return {
      hoje: {
        horarios: l.horarios,
        minimos: exigenciasDaLoja({ ...FUNCOES_PADRAO_MINIMO, ...soNoCalculo(l.minimos) }, l.turnos),
        convencao8h24: l.convencao8h24,
      },
      quadroDeHoje,
      situacao,
    };
  };

  const detalhe = async (s: SimulacaoRegistro, perfil?: string) => {
    const l = await loja(s.lojaId);
    const { c, avaliacao } = avaliar(s, l);
    const dono = perfil === 'TENANT_ADMIN';
    const base = await lojas.baseAtiva(s.lojaId);
    const resultado = resultadoDe(s, l, base?.vendas ?? [], dono);
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
      // Para o cabeçalho da tela: nome da loja, regime e (só o dono) o total de encargos.
      loja: {
        nome: l.nome,
        regime: l.encargos?.regime ?? l.regimeTributario ?? null,
        ...(dono ? { encargosPct: l.encargos?.totalPct ?? null } : {}),
      },
      // Número do botão "Salvar como cenário N" (só enquanto é rascunho).
      ...(s.status === 'rascunho'
        ? { proximoNumeroCenario: await repo.proximoNumeroCenario(s.lojaId) }
        : {}),
      autor: s.autor,
      criadaEm: s.criadaEm,
      gravadaEm: s.gravadaEm,
      editavel: s.status === 'rascunho',
      diasAbertos: c.dias,
      quadro: s.quadro,
      turnos: s.turnos,
      avaliacao,
      resultado,
      // A grade "Cobertura e vendas" com o horário e o quadro desta simulação (a conta do Diagnóstico).
      cobertura: coberturaDaSimulacao({
        dias: c.dias,
        horarios: c.premissas.horarios as Parameters<typeof coberturaDaSimulacao>[0]['horarios'],
        quadro: s.quadro,
        turnos: s.turnos,
        minimos: c.premissas.minimos,
        vendas: base?.vendas ?? [],
        turnosDaLoja: l.turnos,
        dono,
      }),
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
    // A equipe e os horários vêm só do Cadastro de funcionários (a planilha de escala foi aposentada, spec 026).
    const ts = (await lojas.turnosDoCadastro(lojaId)).filter((t) => t.funcao);
    if (ts.length === 0)
      throw new AppError(
        'Cadastre o horário dos funcionários da loja antes de criar a simulação a partir da equipe.',
        400,
        'SEM_HORARIO_NO_CADASTRO',
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
    // Lista com o resumo de cada simulação (a loja, a base comercial e o quadro são lidos uma vez só).
    async listar(lojaId: string, descartadas: boolean, perfil?: string) {
      const l = await loja(lojaId);
      const dono = perfil === 'TENANT_ADMIN';
      const registros = await repo.listar(lojaId, descartadas);
      const base = registros.length ? await lojas.baseAtiva(lojaId) : null;
      const vendas = base?.vendas ?? [];
      const dia = registros.some((x) => x.status === 'gravada')
        ? await hojeDaLoja(l, lojaId, registros)
        : null;
      return {
        data: registros.map((x) => ({
          id: x.id,
          nome: x.nome,
          status: x.status,
          regra: x.regra,
          origemId: x.origemId,
          autor: x.autor,
          criadaPor: nomeDeQuemCriou(x.autor),
          criadaEm: x.criadaEm,
          gravadaEm: x.gravadaEm,
          numeroCenario: x.numeroCenario,
          desatualizada:
            !!dia &&
            motivosDeDesatualizacao({
              status: x.status,
              lojaId,
              quadro: x.quadro,
              premissas: x.premissas,
              ...dia,
            }).length > 0,
          ...resumoDoResultado(resultadoDe(x, l, vendas, dono), dono),
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
      let base: { quadro: PessoaSim[]; turnos: TurnoSim[]; horarios?: unknown };
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
        // A cópia leva o horário simulado junto (nulo = o da loja).
        base = { quadro: o.quadro, turnos: o.turnos, horarios: o.horarios };
        origemId = o.id;
      }
      if (b.comVagasSugeridas) {
        if (b.origem !== 'escala_atual')
          throw new ValidationError('As contratações sugeridas só valem a partir da equipe do Cadastro com horários.');
        const regra = regraPara(b.regra, l.convencao8h24, tabela);
        const sugeridas = vagasSugeridas(
          regra,
          diasAbertos(l.horarios),
          exigenciasDaLoja({ ...FUNCOES_PADRAO_MINIMO, ...soNoCalculo(l.minimos) }, l.turnos),
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
      // A escala por turno saiu da Simulação: as regras de turno (cobertura, jornada, interjornada) não travam mais gravar nem aprovar.
      await repo.gravar(
        id,
        // `horariosDaLoja`: o horário da loja agora, para saber depois se ela mudou (o `horarios` das premissas é o simulado).
        { ...c.premissas, regra: s.regra, horariosDaLoja: l.horarios },
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

    // Compara 2 a 3 simulações da mesma loja, cada uma pelos seus próprios números.
    async comparar(lojaId: string, ids: string[], perfil: string) {
      const l = await loja(lojaId);
      const lista = await Promise.all(ids.map((i) => simulacao(i)));
      if (lista.some((x) => x.lojaId !== lojaId))
        throw new ValidationError('Só dá para comparar simulações da mesma loja');
      if (lista.some((x) => x.status === 'descartada'))
        throw new ValidationError('Simulação descartada não entra na comparação');

      const dono = perfil === 'TENANT_ADMIN';
      const base = await lojas.baseAtiva(lojaId);
      const vendas = base?.vendas ?? [];
      const dia = await hojeDaLoja(l, lojaId, lista);

      const calculadas = lista.map((x) => {
        const { avaliacao } = avaliar(x, l);
        return {
          sim: x,
          resumo: resumoDoResultado(resultadoDe(x, l, vendas, dono), dono),
          ind: calcularIndicadores({
            quadro: x.quadro,
            turnos: x.turnos,
            erros: avaliacao.erros,
            avisos: avaliacao.avisos,
            cobertura: avaliacao.cobertura,
          }),
        };
      });
      const custoDe = (x: SimulacaoRegistro) =>
        calcularCusto({
          regra: x.regra as RegraId,
          quadro: x.quadro,
          custos: custosDaSimulacao(contexto(x, l).premissas.custos, l),
          parametros: tabela,
        });

      return {
        simulacoes: calculadas.map(({ sim, ind, resumo }) => {
          const c = dono ? custoDe(sim) : null;
          const vagas = sim.quadro.filter((p) => p.vaga && !p.desligado).length;
          return {
            id: sim.id,
            nome: sim.nome,
            status: sim.status,
            regra: regraPara(sim.regra as RegraId, false, tabela).nome,
            indicadores: ind,
            ...resumo,
            desatualizada:
              motivosDeDesatualizacao({
                status: sim.status,
                lojaId,
                quadro: sim.quadro,
                premissas: sim.premissas,
                ...dia,
              }).length > 0,
            vagas,
            sintese: sintese(sim.nome, ind, { vagas }),
            // Só o dono recebe este bloco.
            ...(c ? { custo: c } : {}),
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
        // A cópia continua com o mesmo horário simulado (e não volta para o da loja).
        horarios: o.horarios,
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
