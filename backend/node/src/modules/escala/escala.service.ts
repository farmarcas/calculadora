import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { CAMPOS_BASE, CAMPOS_ESCALA, type CampoDef } from '../planilhas/campos.js';
import { inferirUmaAba } from '../planilhas/inferencia.js';
import { lerPlanilha } from '../planilhas/leitor.js';
import { calcularCusto } from '../custos/custo.js';
import {
  normalizarTurnos,
  validarTurnos,
  type TurnoLoja,
  type TurnosLoja,
} from '../regras/turnos.js';
import { diasAbertos, montarDiagnostico } from './diagnostico.js';
import { interpretarBase, interpretarEscala, somarPorHora, type ErroLinha } from './interpretar.js';
import type { EscalaRepository } from './escala.repository.js';
import { premissasDe, type PremissasEntrada } from './premissas.js';

const entendi = (
  campos: CampoDef[],
  aba: { cabecalhos: string[] },
  colunas: Record<string, number | null>,
  sug: { campo: string; confianca: number }[],
) =>
  campos.map((c) => {
    const i = colunas[c.chave] ?? null;
    return {
      campo: c.rotulo,
      coluna: i === null ? null : aba.cabecalhos[i] || `coluna ${i + 1}`,
      confianca: sug.find((s) => s.campo === c.chave)?.confianca ?? 0,
    };
  });

const porLoja = <T extends { loja: string }>(itens: T[]) => {
  const m = new Map<string, T[]>();
  for (const i of itens) m.set(i.loja, [...(m.get(i.loja) ?? []), i]);
  return m;
};
const errosPorLoja = (erros: ErroLinha[]) => {
  const m = new Map<string, number>();
  for (const e of erros) if (e.loja) m.set(e.loja, (m.get(e.loja) ?? 0) + 1);
  return m;
};

export const makeEscalaService = (repo: EscalaRepository, auditar: Auditor) => {
  const abrir = async (arquivo: string, buffer: Buffer, campos: CampoDef[], nomeModelo: string) => {
    const abas = await lerPlanilha(buffer, arquivo);
    const inf = inferirUmaAba(
      abas.filter((a) => !/como preencher/i.test(a.nome)),
      campos,
    );
    if (!inf || inf.faltam.length)
      throw new ValidationError(
        `Não encontrei as colunas obrigatórias: ${(inf?.faltam ?? campos.filter((c) => c.obrigatorio).map((c) => c.rotulo)).join(', ')}. Confira os títulos ou use o ${nomeModelo}.`,
      );
    return inf;
  };

  return {
    async importarEscala(arquivo: string, buffer: Buffer, perfil: string) {
      const inf = await abrir(arquivo, buffer, CAMPOS_ESCALA, 'modelo de escala atual');
      const matriculas = inf.aba.linhas
        .map((l) => (l[inf.colunas.matricula!] ?? '').trim())
        .filter(Boolean);
      const cadastro = await repo.cadastroPorMatriculas(matriculas);
      const { turnos, erros } = interpretarEscala(inf.aba, inf.colunas, cadastro);

      const lojas = await repo.lojasPorCodigos([
        ...new Set([
          ...turnos.map((t) => t.loja),
          ...erros.map((e) => e.loja).filter((x): x is string => !!x),
        ]),
      ]);
      const id = new Map(lojas.map((l) => [l.codigo, l]));
      const rej = errosPorLoja(erros);
      const cadastradas = await repo.matriculasCadastradas(matriculas);

      const resultado: {
        codigo: string;
        nome: string | null;
        aceitas: number;
        rejeitadas: number;
        situacao: string;
      }[] = [];
      for (const [codigo, ts] of porLoja(turnos)) {
        const loja = id.get(codigo);
        if (!loja) {
          resultado.push({
            codigo,
            nome: null,
            aceitas: 0,
            rejeitadas: ts.length + (rej.get(codigo) ?? 0),
            situacao: 'Loja não cadastrada: cadastre antes de importar',
          });
          continue;
        }
        await repo.substituirEscala(loja.id, arquivo, ts, rej.get(codigo) ?? 0, cadastradas);
        resultado.push({
          codigo,
          nome: loja.nome,
          aceitas: ts.length,
          rejeitadas: rej.get(codigo) ?? 0,
          situacao: 'Importada',
        });
      }
      await auditar({
        acao: 'escala.importada',
        perfil,
        alvoTipo: 'carga',
        detalhe: { arquivo, lojas: resultado.length, linhas: turnos.length, erros: erros.length },
      });
      return {
        arquivo,
        entendi: entendi(CAMPOS_ESCALA, inf.aba, inf.colunas, inf.sugestoes),
        lojas: resultado,
        erros: erros.slice(0, 100),
        totalErros: erros.length,
      };
    },

    async importarBase(arquivo: string, buffer: Buffer, perfil: string) {
      const inf = await abrir(arquivo, buffer, CAMPOS_BASE, 'modelo de base comercial');
      const { vendas, erros } = interpretarBase(inf.aba, inf.colunas);
      const lojas = await repo.lojasPorCodigos([
        ...new Set([
          ...vendas.map((v) => v.loja),
          ...erros.map((e) => e.loja).filter((x): x is string => !!x),
        ]),
      ]);
      const id = new Map(lojas.map((l) => [l.codigo, l]));
      const rej = errosPorLoja(erros);

      const resultado: {
        codigo: string;
        nome: string | null;
        aceitas: number;
        rejeitadas: number;
        situacao: string;
      }[] = [];
      for (const [codigo, vs] of porLoja(vendas)) {
        const loja = id.get(codigo);
        if (!loja) {
          resultado.push({
            codigo,
            nome: null,
            aceitas: 0,
            rejeitadas: vs.length,
            situacao: 'Loja não cadastrada: cadastre antes de importar',
          });
          continue;
        }
        const somadas = somarPorHora(vs);
        await repo.substituirBase(loja.id, arquivo, somadas, rej.get(codigo) ?? 0);
        resultado.push({
          codigo,
          nome: loja.nome,
          aceitas: vs.length,
          rejeitadas: rej.get(codigo) ?? 0,
          situacao: 'Importada',
        });
      }
      await auditar({
        acao: 'base-comercial.importada',
        perfil,
        alvoTipo: 'carga',
        detalhe: { arquivo, lojas: resultado.length, linhas: vendas.length, erros: erros.length },
      });
      return {
        arquivo,
        entendi: entendi(CAMPOS_BASE, inf.aba, inf.colunas, inf.sugestoes),
        lojas: resultado,
        erros: erros.slice(0, 100),
        totalErros: erros.length,
      };
    },

    async diagnostico(lojaId: string, perfil?: string, simulacao?: PremissasEntrada) {
      const loja = await repo.lojaParaDiagnostico(lojaId);
      if (!loja) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
      const [escalaImportada, base, doCadastro, parametros, fixos] = await Promise.all([
        repo.escalaAtiva(lojaId),
        repo.baseAtiva(lojaId),
        repo.turnosDoCadastro(lojaId),
        repo.parametrosVigentes(),
        repo.matriculasHorarioFixo(lojaId),
      ]);
      // A escala importada manda; o horário digitado no cadastro completa quem não está nela
      // (ou serve de escala atual quando nada foi importado).
      const importados = new Set((escalaImportada?.turnos ?? []).map((t) => t.matricula));
      const extras = doCadastro.filter((t) => !importados.has(t.matricula));
      const escala =
        escalaImportada ??
        (extras.length > 0
          ? {
              meta: {
                arquivo: 'Cadastro de funcionários',
                recebidaEm: new Date(),
                linhasAceitas: extras.length,
                linhasRejeitadas: 0,
              },
              turnos: [] as typeof extras,
            }
          : null);
      const turnosFinais = [...(escala?.turnos ?? []), ...extras];
      const divergentes = doCadastro.filter((c) => {
        const i = escalaImportada?.turnos.find((t) => t.matricula === c.matricula);
        return (
          !!i && (Math.abs(i.entrada - c.entrada) > 0.01 || Math.abs(i.saida - c.saida) > 0.01)
        );
      });
      const diag = montarDiagnostico({
        loja,
        escala: escala?.meta ?? null,
        turnos: turnosFinais,
        horarioFixo: fixos,
        base: base?.meta ?? null,
        vendas: base?.vendas ?? [],
        dono: perfil === 'TENANT_ADMIN',
        parametros,
        premissas: premissasDe(simulacao).valores,
        margemPctSimulada: premissasDe(simulacao).margemPctSimulada,
        foraDaConta: await repo.foraDaEscala(
          lojaId,
          turnosFinais.map((t) => t.matricula),
        ),
      });
      if (divergentes.length > 0 && diag.pontosAtencao)
        diag.pontosAtencao.push({
          tom: 'atencao',
          texto: `O horário digitado no cadastro difere da escala importada para: ${divergentes.map((d) => d.nome).join(', ')}. A escala importada é a que vale.`,
        });
      // Folha mensal atual: custo, então só o dono do grupo recebe (o campo nem existe para os outros).
      if (perfil !== 'TENANT_ADMIN' || diag.status === 'pendente') return diag;
      const quadro = turnosFinais
        .filter((t) => t.funcao)
        .map((t) => ({ matricula: t.matricula, nome: t.nome, funcao: t.funcao, cargaH: t.cargaH }));
      const custo = calcularCusto({
        regra: 'atual',
        quadro,
        custos: loja.custos ?? null,
        parametros,
      });
      return {
        ...diag,
        folhaMensal: custo.informado
          ? {
              informado: true as const,
              mensal: custo.mensal,
              faltamInformar: custo.faltamInformar,
              encargosPct: loja.custos?.encargosPct ?? 0,
              // O encargo vem do regime tributário da loja: total, composição e o alerta quando o regime falta.
              ...(loja.encargos
                ? {
                    regimeTributario: loja.encargos.regime,
                    regimeAusente: loja.encargos.regimeAusente,
                    encargos: loja.encargos,
                    ...(loja.encargos.regimeAusente
                      ? {
                          alertaRegime:
                            'Não encontramos o regime tributário da loja. Calculamos com Lucro Presumido. Confirme o regime para um resultado mais preciso.',
                        }
                      : {}),
                  }
                : {}),
            }
          : { informado: false as const },
      };
    },

    async configurar(
      lojaId: string,
      c: { convencao8h24?: boolean; minimos?: Record<string, number>; turnos?: TurnoLoja[] | null },
      perfil: string,
    ) {
      const loja = await repo.lojaParaDiagnostico(lojaId);
      if (!loja) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
      let turnos: TurnosLoja | null | undefined;
      if (c.turnos === null) turnos = null;
      else if (c.turnos) {
        const normalizados = normalizarTurnos(c.turnos);
        const erros = validarTurnos(normalizados, diasAbertos(loja.horarios));
        if (erros.length) throw new ValidationError(erros.join(' '));
        turnos = { versao: 1, turnos: normalizados };
      }
      await repo.atualizarConfiguracao(lojaId, { ...c, turnos });
      await auditar({
        acao: 'loja.configuracao',
        perfil,
        alvoTipo: 'loja',
        alvoId: lojaId,
        detalhe: { ...c, turnos: c.turnos ? c.turnos.length : c.turnos },
      });
      return this.diagnostico(lojaId, perfil);
    },

    async historico(lojaId: string) {
      if (!(await repo.lojaParaDiagnostico(lojaId)))
        throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
      return { data: await repo.historico(lojaId) };
    },
  };
};
