import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { postLoja, reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';
import { GE_INICIAL_ID } from '../../shared/ge.js';
import { executarMigracao } from './migrar-escala.runner.js';

describe('migração das escalas importadas para o Cadastro', () => {
  let lojaId: string;

  beforeEach(async () => {
    await prisma.batida.deleteMany();
    await prisma.importacaoPonto.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    lojaId = (
      await postLoja({
        codigo: '001',
        nome: 'Centro',
        horarios: { semana: { abre: '08:00', fecha: '20:00' }, sabado: { abre: '08:00', fecha: '14:00' } },
      })
    ).body.id;
    const func = (matricula: string, nome: string, extra: object = {}) =>
      prisma.funcionario.create({ data: { geId: GE_INICIAL_ID, lojaId, matricula, nome, ...extra } });
    await func('F1', 'Ana'); // sem nada: a escala completa
    await func('F2', 'Bia', { funcaoEscala: 'Caixa', cargaSemanalH: 40, entrada: 9, saida: 18, dias: [0, 1, 2] }); // já tem dados
    const turno = (matricula: string, nome: string, extra: object = {}) => ({
      matricula,
      nome,
      funcao: 'Farmacêutico',
      tipoEscala: null,
      dias: [0, 1, 2, 3, 4],
      entrada: 8,
      iniIntervalo: 12,
      fimIntervalo: 13,
      saida: 17,
      cargaH: 44,
      status: 'ok',
      motivo: null,
      cadastrado: true,
      ...extra,
    });
    await prisma.carga.create({
      data: {
        lojaId,
        tipo: 'ESCALA',
        arquivo: 'escala.xlsx',
        linhasAceitas: 3,
        linhasRejeitadas: 0,
        turnos: { create: [turno('F1', 'Ana'), turno('F2', 'Bia', { entrada: 7, saida: 16 }), turno('Z9', 'Zé')] },
      },
    });
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('o ensaio mostra o que faria e não grava nada', async () => {
    const r = await executarMigracao(prisma, { aplicar: false });
    expect(r.aplicado).toBe(false);
    // Bia já tem horário, função e carga, mas não tem intervalo: só o intervalo é completado.
    expect(r.totais).toEqual({ lojas: 1, preenchidos: 2, jaTinhamDados: 0, semCorrespondente: 1, criados: 0 });
    expect(r.lojas[0]!.semCorrespondente).toEqual([{ matricula: 'Z9', nome: 'Zé' }]);
    const ana = await prisma.funcionario.findFirst({ where: { matricula: 'F1' } });
    expect(ana).toMatchObject({ entrada: null, saida: null, dias: [] });
  });

  it('aplicar preenche só o que está vazio (sem tocar no que o Cadastro já tem) e não cria ninguém', async () => {
    const antes = await prisma.funcionario.count();
    await executarMigracao(prisma, { aplicar: true });
    const ana = await prisma.funcionario.findFirst({ where: { matricula: 'F1' } });
    expect(ana).toMatchObject({ entrada: 8, saida: 17, iniIntervalo: 12, fimIntervalo: 13, dias: [0, 1, 2, 3, 4], funcaoEscala: 'Farmacêutico', cargaSemanalH: 44 });
    const bia = await prisma.funcionario.findFirst({ where: { matricula: 'F2' } });
    expect(bia).toMatchObject({ entrada: 9, saida: 18, dias: [0, 1, 2], funcaoEscala: 'Caixa', cargaSemanalH: 40, iniIntervalo: 12, fimIntervalo: 13 });
    expect(await prisma.funcionario.count()).toBe(antes);
  });

  it('com --criar-ausentes cria quem está na escala e não tem funcionário; sem a opção ninguém é criado', async () => {
    await executarMigracao(prisma, { aplicar: true });
    expect(await prisma.funcionario.findFirst({ where: { matricula: 'Z9' } })).toBeNull();
    const r = await executarMigracao(prisma, { aplicar: true, criarAusentes: true });
    expect(r.totais.criados).toBe(1);
    expect(await prisma.funcionario.findFirst({ where: { matricula: 'Z9' } })).toMatchObject({ nome: 'Zé', entrada: 8, saida: 17, iniIntervalo: 12, fimIntervalo: 13, funcaoEscala: 'Farmacêutico' });
  });

  it('é repetível: a segunda execução não muda nada', async () => {
    await executarMigracao(prisma, { aplicar: true });
    const foto = JSON.stringify(await prisma.funcionario.findMany({ orderBy: { matricula: 'asc' } }));
    const r = await executarMigracao(prisma, { aplicar: true });
    expect(r.totais.preenchidos).toBe(0);
    expect(JSON.stringify(await prisma.funcionario.findMany({ orderBy: { matricula: 'asc' } }))).toBe(foto);
  });

  it('nenhuma escala importada é apagada', async () => {
    const antes = [await prisma.carga.count(), await prisma.turnoAtual.count()];
    await executarMigracao(prisma, { aplicar: true });
    expect([await prisma.carga.count(), await prisma.turnoAtual.count()]).toEqual(antes);
  });

  it('depois da migração o Diagnóstico usa a equipe migrada (a mesma que a escala dizia)', async () => {
    await executarMigracao(prisma, { aplicar: true });
    const d = (await reqGe().get(`/api/v1/lojas/${lojaId}/diagnostico`)).body;
    expect(d.status).not.toBe('pendente');
    const nomes = d.colaboradores.map((c: { nome: string }) => c.nome).sort();
    expect(nomes).toEqual(['Ana', 'Bia']);
    expect(d.numeros.colaboradoresNoCalculo).toBe(2);
  });
});
