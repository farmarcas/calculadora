import { Prisma } from '../../generated/prisma/client.js';
import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { prisma } from '../../shared/database/prisma.js';
import { avisosDeTurnos, normalizarTurnos, validarTurnos, type TurnosLoja } from '../regras/turnos.js';
import { manterAjustesAntigos, type CustosGravados } from '../custos/custos.schemas.js';
import type { configuracaoBody } from '../escala/escala.schemas.js';
import type { z } from 'zod';
import type { CadastrosRepository, LojaRegistro } from './cadastros.service.js';
import { manterMargem, ocultarFaturamento, type Faturamento } from './faturamento.js';
import { faixasDaSemana, normalizarHorarios } from './horarios.js';
import type { LojaBody } from './cadastros.schemas.js';
import { pendenciasDoCadastro, situacaoDoCadastro } from './situacao.js';

export type PainelBody = {
  loja?: Partial<LojaBody>;
  configuracao?: z.infer<typeof configuracaoBody>;
  custos?: CustosGravados;
};

const ativo = { deletedAt: null } as const;
const DONO = 'TENANT_ADMIN';
const GESTOR = 'SCHEDULE_MANAGER';
const OPERADOR = 'PLATFORM_OPERATOR';
const semPermissao = (m: string) => new AppError(m, 403, 'SEM_PERMISSAO');

// "Salvar alterações" da tela de Cadastro de loja: dados, funcionamento, faturamento, configuração e custos de uma vez.
// Tudo é validado ANTES de gravar e vai numa única atualização da loja (mesma linha do banco): ou grava tudo, ou nada.
export const makePainelService = (geId: string, cadastros: CadastrosRepository, auditar: Auditor) => ({
  async salvar(lojaId: string, body: PainelBody, perfil: string) {
    // 1 · Quem pode mexer em quê (o mesmo que as rotas separadas já exigiam).
    if (body.loja) {
      if (![OPERADOR, DONO, GESTOR].includes(perfil)) throw semPermissao('Seu perfil não pode editar a loja');
      if (body.loja.faturamento !== undefined && perfil !== DONO)
        throw semPermissao('Só o dono informa o faturamento da loja');
    }
    if (body.configuracao && ![DONO, GESTOR].includes(perfil))
      throw semPermissao('Seu perfil não pode alterar as regras da loja');
    if (body.custos && perfil !== DONO) throw semPermissao('Só o dono informa os custos da loja');

    const atual = await cadastros.buscarLoja(lojaId);
    if (!atual) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    const bruto = await prisma.loja.findFirstOrThrow({
      where: { id: lojaId, geId, ...ativo },
      select: {
        turnos: true,
        minimos: true,
        custos: true,
        horarios: true,
        regimeTributario: true,
        faturamento: true,
      },
    });

    const dados: Prisma.LojaUpdateInput = {};

    // 2 · Dados da loja (mesmas regras de `editarLoja`: código e CNPJ só o operador altera, sem duplicar).
    const l = body.loja;
    if (l) {
      if (l.cnpj !== undefined) {
        if (perfil === OPERADOR) {
          if (l.cnpj !== atual.cnpj && (await cadastros.cnpjEmUso(l.cnpj, lojaId)))
            throw new ConflictError('Este CNPJ já está cadastrado', 'CNPJ_EM_USO');
        } else if (l.cnpj !== (atual.cnpj ?? undefined))
          throw new AppError(
            'O CNPJ da loja só pode ser alterado por quem cuida da plataforma',
            400,
            'CNPJ_NAO_EDITAVEL',
          );
      }
      if (l.codigo !== undefined && l.codigo !== atual.codigo && perfil !== OPERADOR)
        throw new AppError(
          'O código da loja só pode ser alterado por quem cuida da plataforma',
          400,
          'CODIGO_NAO_EDITAVEL',
        );
      if (l.codigo) {
        const outra = await cadastros.buscarLojaPorCodigo(l.codigo);
        if (outra && outra.id !== lojaId)
          throw new ConflictError('Já existe loja com esse código', 'LOJA_DUPLICADA');
      }
      for (const k of ['codigo', 'nome', 'cnpj', 'cidade', 'uf', 'marca', 'regimeTributario'] as const)
        if (l[k] !== undefined) (dados as Record<string, unknown>)[k] = l[k];
      if (l.horarios !== undefined) dados.horarios = l.horarios as unknown as Prisma.InputJsonValue;
      if (l.faturamento !== undefined) {
        const fat = manterMargem(l.faturamento as Faturamento | null, bruto.faturamento);
        dados.faturamento = fat === null ? Prisma.JsonNull : (fat as never);
      }
    }
    const horariosFinais = normalizarHorarios(l?.horarios !== undefined ? l.horarios : bruto.horarios);

    // 3 · Configuração: convenção, mínimo único, turnos e modo do mínimo.
    const c = body.configuracao;
    let turnosFinais: TurnosLoja | null | undefined;
    if (c) {
      if (c.convencao8h24 !== undefined) dados.convencao8h24 = c.convencao8h24;
      if (c.minimos)
        dados.minimos = { ...((bruto.minimos as object | null) ?? {}), ...c.minimos };
      const guardados = bruto.turnos as unknown as TurnosLoja | null;
      if (c.turnos === null) turnosFinais = null;
      else if (c.turnos) {
        const normalizados = normalizarTurnos(c.turnos);
        const erros = validarTurnos(normalizados, faixasDaSemana(horariosFinais));
        if (erros.length) throw new ValidationError(erros.join(' '));
        const modo = c.modoMinimo ?? guardados?.modo;
        turnosFinais = { versao: 1, ...(modo ? { modo } : {}), turnos: normalizados };
      } else if (c.modoMinimo && guardados) turnosFinais = { ...guardados, modo: c.modoMinimo };
      if (turnosFinais !== undefined)
        dados.turnos = turnosFinais === null ? Prisma.JsonNull : (turnosFinais as never);
    }

    // 4 · Custos: os ajustes antigos de RAT/FAP/rescisão já guardados continuam como estão (não valem mais).
    if (body.custos) {
      const { encargosPct: _antigo, ...novo } = body.custos;
      void _antigo;
      dados.custos = manterAjustesAntigos(novo, bruto.custos) as unknown as Prisma.InputJsonValue;
    }

    // 5 · Uma única gravação.
    await prisma.loja.update({ where: { id: lojaId, geId }, data: dados });
    await auditar({
      acao: 'loja.painel',
      perfil,
      alvoTipo: 'loja',
      alvoId: lojaId,
      detalhe: { blocos: [l && 'loja', c && 'configuracao', body.custos && 'custos'].filter(Boolean) },
    });

    // 6 · Devolve o que a tela precisa para se atualizar.
    return this.ler(lojaId, perfil);
  },

  async ler(lojaId: string, perfil: string) {
    const todas = await cadastros.lojasComEquipe();
    const achada = todas.find((x) => x.loja.id === lojaId);
    if (!achada) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    const turnos = (
      await prisma.loja.findFirstOrThrow({ where: { id: lojaId, geId }, select: { turnos: true } })
    ).turnos as unknown as TurnosLoja | null;
    const loja: LojaRegistro = achada.loja;
    const horarios = normalizarHorarios((loja as unknown as { horarios: unknown }).horarios);
    return {
      loja: ocultarFaturamento(loja as LojaRegistro & { faturamento?: unknown }, perfil),
      situacao: {
        ...situacaoDoCadastro(
          loja as unknown as Parameters<typeof situacaoDoCadastro>[0],
          achada.farmaceuticos,
          achada.cadastro,
        ),
        // Tudo o que falta, para o painel "O que falta preencher" (nunca traz valores em reais).
        pendencias: pendenciasDoCadastro(
          loja as unknown as Parameters<typeof pendenciasDoCadastro>[0],
          achada.farmaceuticos,
          achada.cadastro,
        ),
      },
      // O que a tela precisa da equipe para refazer a conta sobre o que a pessoa digita (sem salários).
      equipe: {
        farmaceuticos: achada.farmaceuticos,
        funcoesNaEquipe: achada.cadastro.funcoesNaEquipe,
      },
      avisosDeTurnos: avisosDeTurnos(turnos, faixasDaSemana(horarios)),
    };
  },
});
