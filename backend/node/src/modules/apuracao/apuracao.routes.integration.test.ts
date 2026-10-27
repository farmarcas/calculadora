import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import ExcelJS from 'exceljs';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';
import { gerarAfd, type Marcacao } from '../ponto/afd.fake.js';
import {
  CNPJ_DIGITOS,
  CPF_ANA,
  CPF_BIA,
  admin,
  limparTudo,
  montarLojaComSimulacaoEmUso,
} from '../ponto/ponto.fixtures.js';

const dias = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'];
// Semana cumprida à risca (Ana 08–14, Bia 14–20), com: atraso de 30 min da Ana na terça,
// 1h de hora extra da Bia na terça, e falta da Ana na quarta.
const marcacoes: Marcacao[] = dias.flatMap((data) => {
  const ana =
    data === '2026-10-07'
      ? []
      : [
          { cpf: CPF_ANA, data, hora: data === '2026-10-06' ? '08:30' : '08:00' },
          { cpf: CPF_ANA, data, hora: '14:00' },
        ];
  const bia = [
    { cpf: CPF_BIA, data, hora: '14:00' },
    { cpf: CPF_BIA, data, hora: data === '2026-10-06' ? '21:00' : '20:00' },
  ];
  return [...ana, ...bia];
});

describe('apuração planejado × realizado (rotas)', () => {
  let lojaId: string;
  const url = (p: string) => `/api/v1/lojas/${lojaId}/apuracao/${p}`;

  beforeEach(async () => {
    await limparTudo();
    lojaId = (await montarLojaComSimulacaoEmUso()).loja.id;
    // marcações em ordem cronológica, como o REP grava
    const ordenadas = [...marcacoes].sort((a, b) =>
      (a.data + a.hora).localeCompare(b.data + b.hora),
    );
    const arq = Buffer.from(
      gerarAfd({
        cnpj: CNPJ_DIGITOS,
        dataInicial: '2026-10-05',
        dataFinal: '2026-10-09',
        marcacoes: ordenadas,
      }),
      'latin1',
    );
    const r = await request(app)
      .post(`/api/v1/lojas/${lojaId}/ponto/importacoes`)
      .set(admin)
      .attach('arquivos', arq, 'a.txt');
    expect(r.body.arquivos[0].status).toBe('processado');
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('apura a loja e confere com a conta manual', async () => {
    const r = await request(app).get(url('loja')).set(admin);
    expect(r.status).toBe(200);
    expect(r.body.rotulo).toBe('apuração gerencial — não substitui o registro oficial de ponto');
    // A apuração começa na vigência da simulação em uso (01/10) e só conta os dias que o ponto importado cobre.
    expect(r.body.periodo).toMatchObject({ de: '2026-10-01', ate: '2026-10-09', diasApurados: 5 });
    // Planejado: 5 dias × 12h = 60h. Cumprido: Ana 6+5,5+0+6+6 = 23,5h; Bia 6×5 = 30h (a 1h extra da terça fica fora do plano).
    expect(r.body.loja).toMatchObject({
      horasPlanejadas: 60,
      horasCumpridas: 53.5,
      aderenciaPct: 89.17,
      horaExtraH: 1,
      horaExtraPorFuncao: { Farmacêutico: 1 },
      faltas: 1,
      atrasos: 1,
    });
    expect(r.body.loja.horaExtraPorDiaSemana.find((d: { dia: string }) => d.dia === 'Ter')).toEqual(
      { dia: 'Ter', horas: 1 },
    );
    // Sem farmacêutico: terça das 08h às 09h (Ana chegou 08:30) e quarta das 08h às 14h (falta da Ana).
    expect(r.body.loja.cobertura.descobertas).toEqual([
      { data: '2026-10-06', funcao: 'Farmacêutico', de: '08:00', ate: '09:00' },
      { data: '2026-10-07', funcao: 'Farmacêutico', de: '08:00', ate: '14:00' },
    ]);
    expect(r.body.loja.cobertura.horasAbaixoDoMinimo).toEqual({ Farmacêutico: 7 });
    // A hora extra da terça é depois do fechamento planejado: causa provável = plano (sugestão).
    expect(r.body.loja.causaProvavelHoraExtra).toMatchObject({
      sugestao: true,
      plano: 1,
      quadro: 0,
      execucao: 0,
    });
  });

  it('por pessoa e dia, dono e gestor veem as ocorrências com nome', async () => {
    const r = await request(app).get(url('pessoas')).set({ 'X-Perfil': 'SCHEDULE_MANAGER' });
    expect(r.status).toBe(200);
    expect(r.body.rotulo).toContain('apuração gerencial');
    const ana = r.body.pessoas.find((p: { matricula: string }) => p.matricula === 'F1');
    expect(ana.nome).toBe('Ana');
    expect(
      ana.dias.find((d: { data: string }) => d.data === '2026-10-06').ocorrencias[0],
    ).toMatchObject({ tipo: 'atraso', minutos: 30 });
    expect(ana.dias.find((d: { data: string }) => d.data === '2026-10-07')).toMatchObject({
      situacao: 'falta',
      realizadoH: 0,
    });
    const bia = r.body.pessoas.find((p: { matricula: string }) => p.matricula === 'F2');
    expect(bia.dias.find((d: { data: string }) => d.data === '2026-10-06')).toMatchObject({
      horaExtraH: 1,
      realizadoH: 7,
    });
  });

  it('quem só consulta vê só o agregado da loja: sem nome, sem batida', async () => {
    const h = { 'X-Perfil': 'SCHEDULE_VIEWER' };
    expect((await request(app).get(url('pessoas')).set(h)).status).toBe(403);
    expect((await request(app).get(url('exportar.xlsx')).set(h)).status).toBe(403);
    const r = await request(app).get(url('loja')).set(h);
    expect(r.status).toBe(200);
    expect(r.body.loja.aderenciaPct).toBe(89.17);
    expect(JSON.stringify(r.body)).not.toMatch(/Ana|Bia|F1|F2|"batidas"|"pessoas"/);
  });

  it('um recorte do período muda o resultado; antes da vigência não se apura', async () => {
    const r = await request(app).get(url('loja?de=2026-10-05&ate=2026-10-05')).set(admin);
    expect(r.body.loja).toMatchObject({ aderenciaPct: 100, faltas: 0, horaExtraH: 0 });
    expect((await request(app).get(url('loja?de=outubro')).set(admin)).status).toBe(400);
  });

  it('exporta o Excel com o rótulo gerencial e registra na auditoria', async () => {
    const r = await request(app)
      .get(url('exportar.xlsx'))
      .set(admin)
      .buffer()
      .parse((res, cb) => {
        const ch: Buffer[] = [];
        res.on('data', (d: Buffer) => ch.push(d));
        res.on('end', () => cb(null, Buffer.concat(ch)));
      });
    expect(r.status).toBe(200);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(r.body as ArrayBuffer);
    expect(String(wb.getWorksheet('Apuração por pessoa')!.getCell('A2').value)).toContain(
      'APURAÇÃO GERENCIAL — NÃO SUBSTITUI O REGISTRO OFICIAL DE PONTO',
    );
    expect(String(wb.getWorksheet('Resumo da loja')!.getCell('A1').value)).toContain(
      'APURAÇÃO GERENCIAL',
    );
    expect(await prisma.auditoria.count({ where: { acao: 'apuracao.exportada' } })).toBe(1);
  });

  it('sem simulação em uso, explica', async () => {
    const outra = (
      await request(app).post('/api/v1/lojas').set(admin).send({ codigo: '009', nome: 'Sem uso' })
    ).body;
    const r = await request(app).get(`/api/v1/lojas/${outra.id}/apuracao/loja`).set(admin);
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('SEM_SIMULACAO_EM_USO');
  });
});
