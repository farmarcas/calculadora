import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import ExcelJS from 'exceljs';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN' };

const planilha = async (
  lojas: string[][],
  funcs: string[][],
  cabL = ['Cód_Loja', 'Nome_Loja'],
  cabF = ['ID_Colaborador', 'Nome_Colaborador', 'Cod_Loja', 'Funcao'],
) => {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Filiais').addRows([cabL, ...lojas]);
  wb.addWorksheet('Quadro').addRows([cabF, ...funcs]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};

describe('cadastros (rotas)', () => {
  beforeEach(async () => {
    await prisma.batida.deleteMany();
    await prisma.importacaoPonto.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    await prisma.importacaoCadastro.deleteMany();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('baixa a planilha modelo', async () => {
    const res = await request(app)
      .get('/api/v1/planilha-modelo')
      .buffer()
      .parse((r, cb) => {
        const c: Buffer[] = [];
        r.on('data', (d: Buffer) => c.push(d));
        r.on('end', () => cb(null, Buffer.concat(c)));
      });
    expect(res.status).toBe(200);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body as ArrayBuffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual(['Lojas', 'Funcionários', 'Como preencher']);
  });

  it('importa planilha fora do modelo: sugere, confirma e não duplica ao reenviar', async () => {
    const arq = await planilha(
      [['001', 'Centro']],
      [
        ['F1', 'Ana', '001', 'Balconista'],
        ['F2', 'Bia', '999', 'Caixa'],
      ],
    );

    const prev = await request(app)
      .post('/api/v1/importacoes/cadastro')
      .set(admin)
      .attach('arquivo', arq, 'x.xlsx');
    expect(prev.status).toBe(201);
    expect(prev.body.mapeamento.lojas.aba).toBe('Filiais');
    expect(prev.body.mapeamento.funcionarios.colunas.loja).toBe(2);

    const ok = await request(app)
      .post(`/api/v1/importacoes/cadastro/${prev.body.id}/confirmar`)
      .set(admin)
      .send({ mapeamento: prev.body.mapeamento });
    expect(ok.status).toBe(200);
    expect(ok.body.lojas.novos).toBe(1);
    expect(ok.body.funcionarios.novos).toBe(1);
    expect(ok.body.erros[0].motivo).toContain('loja 999 não existe');

    const prev2 = await request(app)
      .post('/api/v1/importacoes/cadastro')
      .set(admin)
      .attach('arquivo', arq, 'x.xlsx');
    const again = await request(app)
      .post(`/api/v1/importacoes/cadastro/${prev2.body.id}/confirmar`)
      .set(admin)
      .send({ mapeamento: prev2.body.mapeamento });
    expect(again.body.lojas).toEqual({ novos: 0, atualizados: 1 });
    expect(await prisma.loja.count()).toBe(1);
    expect(await prisma.funcionario.count()).toBe(1);
    expect((await prisma.funcionario.findFirstOrThrow()).funcaoEscala).toBe('Atendimento');
  });

  it('bloqueia escrita para quem só consulta', async () => {
    const res = await request(app).post('/api/v1/lojas').send({ codigo: '1', nome: 'Loja' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SEM_PERMISSAO');
  });

  it('cria, lista, edita e remove loja; recusa código repetido e loja com funcionários', async () => {
    const c = await request(app)
      .post('/api/v1/lojas')
      .set(admin)
      .send({ codigo: '010', nome: 'Loja Dez' });
    expect(c.status).toBe(201);
    expect(
      (await request(app).post('/api/v1/lojas').set(admin).send({ codigo: '010', nome: 'Outra' }))
        .status,
    ).toBe(409);
    const f = await request(app)
      .post('/api/v1/funcionarios')
      .set(admin)
      .send({ matricula: 'M1', nome: 'Carla', lojaId: c.body.id, funcaoEscala: 'Caixa' });
    expect(f.status).toBe(201);
    expect((await request(app).delete(`/api/v1/lojas/${c.body.id}`).set(admin)).status).toBe(409);
    expect(
      (await request(app).patch(`/api/v1/lojas/${c.body.id}`).set(admin).send({ nome: 'Dez Novo' }))
        .body.nome,
    ).toBe('Dez Novo');
    expect(
      (await request(app).get('/api/v1/funcionarios?lojaId=' + c.body.id)).body.meta.total,
    ).toBe(1);
    expect((await request(app).delete(`/api/v1/funcionarios/${f.body.id}`).set(admin)).status).toBe(
      204,
    );
    expect((await request(app).delete(`/api/v1/lojas/${c.body.id}`).set(admin)).status).toBe(204);
  });

  describe('horário da loja por dia da semana', () => {
    const dia = (abre: string, fecha: string) => ({ aberta: true, abre, fecha });
    const semanaCompleta = {
      versao: 2,
      dias: [
        dia('08:00', '22:00'),
        dia('08:00', '22:00'),
        dia('08:00', '22:00'),
        dia('08:00', '22:00'),
        dia('08:00', '22:00'),
        dia('08:00', '20:00'),
        { aberta: false },
      ],
    };

    it('guarda os sete dias como informados e devolve o mesmo ao reabrir', async () => {
      const c = await request(app)
        .post('/api/v1/lojas')
        .set(admin)
        .send({ codigo: '010', nome: 'Semana', horarios: semanaCompleta });
      expect(c.status).toBe(201);
      expect(c.body.horarios.dias).toHaveLength(7);
      expect(c.body.horarios.dias[5]).toEqual({ aberta: true, abre: '08:00', fecha: '20:00' });
      expect(c.body.horarios.dias[6]).toEqual({ aberta: false });
      const lida = (await request(app).get('/api/v1/lojas').set(admin)).body.data.find(
        (l: { codigo: string }) => l.codigo === '010',
      );
      expect(lida.horarios).toEqual(c.body.horarios);
    });

    it('loja 24 horas: sete dias de 00:00 a 24:00, e um dia pode ser ajustado depois', async () => {
      const h24 = { aberta: true, h24: true };
      const c = await request(app)
        .post('/api/v1/lojas')
        .set(admin)
        .send({
          codigo: '024',
          nome: 'Vinte e quatro',
          horarios: { versao: 2, dias: Array.from({ length: 7 }, () => h24) },
        });
      expect(c.status).toBe(201);
      expect(
        c.body.horarios.dias.every(
          (d: { h24: boolean; abre: string; fecha: string }) =>
            d.h24 && d.abre === '00:00' && d.fecha === '24:00',
        ),
      ).toBe(true);
      const dias = [...c.body.horarios.dias];
      dias[6] = { aberta: false };
      const e = await request(app)
        .patch(`/api/v1/lojas/${c.body.id}`)
        .set(admin)
        .send({ horarios: { versao: 2, dias } });
      expect(e.body.horarios.dias[6]).toEqual({ aberta: false });
      expect(e.body.horarios.dias[0].h24).toBe(true);
    });

    it('o formato antigo continua aceito e sai como o novo; loja antiga lida do banco também', async () => {
      const c = await request(app)
        .post('/api/v1/lojas')
        .set(admin)
        .send({
          codigo: '011',
          nome: 'Antiga',
          horarios: {
            semana: { abre: '08:00', fecha: '22:00' },
            domingo: { abre: '09:00', fecha: '13:00' },
          },
        });
      expect(c.status).toBe(201);
      expect(c.body.horarios.dias.map((d: { aberta: boolean }) => d.aberta)).toEqual([
        true,
        true,
        true,
        true,
        true,
        false,
        true,
      ]);
      // gravada direto no banco no formato antigo (como as lojas de antes desta mudança)
      await prisma.loja.update({
        where: { id: c.body.id },
        data: { horarios: { semana: { abre: '07:00', fecha: '19:00' } } },
      });
      const lida = (await request(app).get('/api/v1/lojas').set(admin)).body.data.find(
        (l: { codigo: string }) => l.codigo === '011',
      );
      expect(lida.horarios.dias[0]).toEqual({ aberta: true, abre: '07:00', fecha: '19:00' });
      expect(lida.horarios.dias[6]).toEqual({ aberta: false });
    });

    it('importa a planilha do modelo novo: domingo fechado, loja 24h e planilha antiga', async () => {
      const wb = new ExcelJS.Workbook();
      wb.addWorksheet('Lojas').addRows([
        [
          'Código da loja',
          'Nome da loja',
          'Loja 24 horas (Sim/Não)',
          'Abre segunda',
          'Fecha segunda',
          'Abre sábado',
          'Fecha sábado',
          'Abre domingo',
          'Fecha domingo',
        ],
        [
          '020',
          'Com domingo fechado',
          'Não',
          '08:00',
          '22:00',
          '08:00',
          '20:00',
          'Fechada',
          'Fechada',
        ],
        ['021', 'Vinte e quatro', 'Sim', '', '', '', '', '', ''],
        ['022', 'Horário ruim', 'Não', 'cedo', '22:00', '', '', '', ''],
      ]);
      const arq = Buffer.from(await wb.xlsx.writeBuffer());
      const prev = await request(app)
        .post('/api/v1/importacoes/cadastro')
        .set(admin)
        .attach('arquivo', arq, 'lojas.xlsx');
      expect(prev.status).toBe(201);
      expect(prev.body.mapeamento.lojas.colunas).toMatchObject({
        loja_24h: 2,
        abre_seg: 3,
        abre_dom: 7,
      });
      const ok = await request(app)
        .post(`/api/v1/importacoes/cadastro/${prev.body.id}/confirmar`)
        .set(admin)
        .send({ mapeamento: prev.body.mapeamento });
      expect(ok.body.lojas).toEqual({ novos: 2, atualizados: 0 });
      expect(ok.body.erros[0].motivo).toContain('Horário de segunda inválido');

      const lojas = (await request(app).get('/api/v1/lojas?pageSize=50').set(admin)).body.data;
      const l20 = lojas.find((l: { codigo: string }) => l.codigo === '020');
      expect(l20.horariosResumo).toBe(
        'Seg 08:00–22:00 · Ter a sex fechada · Sáb 08:00–20:00 · Dom fechada',
      );
      expect(lojas.find((l: { codigo: string }) => l.codigo === '021').horariosResumo).toBe(
        'Todos os dias 24h',
      );

      // Reimportar sem horário não apaga o que a loja já tem
      const sem = new ExcelJS.Workbook();
      sem.addWorksheet('Lojas').addRows([
        ['Código da loja', 'Nome da loja'],
        ['020', 'Renomeada'],
      ]);
      const p2 = await request(app)
        .post('/api/v1/importacoes/cadastro')
        .set(admin)
        .attach('arquivo', Buffer.from(await sem.xlsx.writeBuffer()), 'l2.xlsx');
      await request(app)
        .post(`/api/v1/importacoes/cadastro/${p2.body.id}/confirmar`)
        .set(admin)
        .send({ mapeamento: p2.body.mapeamento });
      const depois = (
        await request(app).get('/api/v1/lojas?pageSize=50').set(admin)
      ).body.data.find((l: { codigo: string }) => l.codigo === '020');
      expect(depois.nome).toBe('Renomeada');
      expect(depois.horariosResumo).toContain('Sáb 08:00–20:00');
    });

    it('importa planilha com as colunas antigas (semana, sábado, domingo)', async () => {
      const wb = new ExcelJS.Workbook();
      wb.addWorksheet('Filiais').addRows([
        [
          'Cód_Loja',
          'Razão Social',
          'Abre semana',
          'Fecha semana',
          'Abertura Sábado',
          'Fechamento Sábado',
        ],
        ['030', 'Antiga', '08:00', '22:00', '09:00', '13:00'],
      ]);
      const prev = await request(app)
        .post('/api/v1/importacoes/cadastro')
        .set(admin)
        .attach('arquivo', Buffer.from(await wb.xlsx.writeBuffer()), 'a.xlsx');
      await request(app)
        .post(`/api/v1/importacoes/cadastro/${prev.body.id}/confirmar`)
        .set(admin)
        .send({ mapeamento: prev.body.mapeamento });
      const l = (await request(app).get('/api/v1/lojas?pageSize=50').set(admin)).body.data.find(
        (x: { codigo: string }) => x.codigo === '030',
      );
      expect(l.horariosResumo).toBe('Seg a sex 08:00–22:00 · Sáb 09:00–13:00 · Dom fechada');
    });

    it('recusa fechamento antes da abertura, dia aberto sem horário e semana com dias a menos', async () => {
      const post = (horarios: object) =>
        request(app)
          .post('/api/v1/lojas')
          .set(admin)
          .send({ codigo: '012', nome: 'Erro', horarios });
      const ruim = {
        ...semanaCompleta,
        dias: [dia('22:00', '08:00'), ...semanaCompleta.dias.slice(1)],
      };
      const r = await post(ruim);
      expect(r.status).toBe(400);
      expect(JSON.stringify(r.body.error.details)).toContain(
        'Seg: o fechamento (08:00) precisa ser depois da abertura (22:00)',
      );
      expect(
        (await post({ versao: 2, dias: [{ aberta: true }, ...semanaCompleta.dias.slice(1)] }))
          .status,
      ).toBe(400);
      expect((await post({ versao: 2, dias: semanaCompleta.dias.slice(0, 6) })).status).toBe(400);
      expect((await post({})).status).toBe(400);
    });
  });
});
