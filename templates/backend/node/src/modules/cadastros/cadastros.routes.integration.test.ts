import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';
import { GE_INICIAL_ID } from '../../shared/ge.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN', 'X-GE': GE_INICIAL_ID };

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
    const res = await reqGe()
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

    const prev = await reqGe()
      .post('/api/v1/importacoes/cadastro')
      .set(admin)
      .attach('arquivo', arq, 'x.xlsx');
    expect(prev.status).toBe(201);
    expect(prev.body.mapeamento.lojas.aba).toBe('Filiais');
    expect(prev.body.mapeamento.funcionarios.colunas.loja).toBe(2);

    const ok = await reqGe()
      .post(`/api/v1/importacoes/cadastro/${prev.body.id}/confirmar`)
      .set(admin)
      .send({ mapeamento: prev.body.mapeamento });
    expect(ok.status).toBe(200);
    expect(ok.body.lojas.novos).toBe(1);
    expect(ok.body.funcionarios.novos).toBe(1);
    expect(ok.body.erros[0].motivo).toContain('loja 999 não existe');

    const prev2 = await reqGe()
      .post('/api/v1/importacoes/cadastro')
      .set(admin)
      .attach('arquivo', arq, 'x.xlsx');
    const again = await reqGe()
      .post(`/api/v1/importacoes/cadastro/${prev2.body.id}/confirmar`)
      .set(admin)
      .send({ mapeamento: prev2.body.mapeamento });
    expect(again.body.lojas).toEqual({ novos: 0, atualizados: 1 });
    expect(await prisma.loja.count()).toBe(1);
    expect(await prisma.funcionario.count()).toBe(1);
    expect((await prisma.funcionario.findFirstOrThrow()).funcaoEscala).toBe('Atendimento');
  });

  it('bloqueia escrita para quem só consulta', async () => {
    const res = await reqGe().post('/api/v1/lojas').send({ codigo: '1', nome: 'Loja' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SEM_PERMISSAO');
  });

  it('cria, lista, edita e remove loja; recusa código repetido e loja com funcionários', async () => {
    const c = await reqGe()
      .post('/api/v1/lojas')
      .set(admin)
      .send({ codigo: '010', nome: 'Loja Dez' });
    expect(c.status).toBe(201);
    expect(
      (await reqGe().post('/api/v1/lojas').set(admin).send({ codigo: '010', nome: 'Outra' }))
        .status,
    ).toBe(409);
    const f = await reqGe()
      .post('/api/v1/funcionarios')
      .set(admin)
      .send({ matricula: 'M1', nome: 'Carla', lojaId: c.body.id, funcaoEscala: 'Caixa' });
    expect(f.status).toBe(201);
    expect((await reqGe().delete(`/api/v1/lojas/${c.body.id}`).set(admin)).status).toBe(409);
    expect(
      (await reqGe().patch(`/api/v1/lojas/${c.body.id}`).set(admin).send({ nome: 'Dez Novo' })).body
        .nome,
    ).toBe('Dez Novo');
    expect((await reqGe().get('/api/v1/funcionarios?lojaId=' + c.body.id)).body.meta.total).toBe(1);
    expect((await reqGe().delete(`/api/v1/funcionarios/${f.body.id}`).set(admin)).status).toBe(204);
    expect((await reqGe().delete(`/api/v1/lojas/${c.body.id}`).set(admin)).status).toBe(204);
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
      const c = await reqGe()
        .post('/api/v1/lojas')
        .set(admin)
        .send({ codigo: '010', nome: 'Semana', horarios: semanaCompleta });
      expect(c.status).toBe(201);
      expect(c.body.horarios.dias).toHaveLength(7);
      expect(c.body.horarios.dias[5]).toEqual({ aberta: true, abre: '08:00', fecha: '20:00' });
      expect(c.body.horarios.dias[6]).toEqual({ aberta: false });
      const lida = (await reqGe().get('/api/v1/lojas').set(admin)).body.data.find(
        (l: { codigo: string }) => l.codigo === '010',
      );
      expect(lida.horarios).toEqual(c.body.horarios);
    });

    it('loja 24 horas: sete dias de 00:00 a 24:00, e um dia pode ser ajustado depois', async () => {
      const h24 = { aberta: true, h24: true };
      const c = await reqGe()
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
      const e = await reqGe()
        .patch(`/api/v1/lojas/${c.body.id}`)
        .set(admin)
        .send({ horarios: { versao: 2, dias } });
      expect(e.body.horarios.dias[6]).toEqual({ aberta: false });
      expect(e.body.horarios.dias[0].h24).toBe(true);
    });

    it('o formato antigo continua aceito e sai como o novo; loja antiga lida do banco também', async () => {
      const c = await reqGe()
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
      const lida = (await reqGe().get('/api/v1/lojas').set(admin)).body.data.find(
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
      const prev = await reqGe()
        .post('/api/v1/importacoes/cadastro')
        .set(admin)
        .attach('arquivo', arq, 'lojas.xlsx');
      expect(prev.status).toBe(201);
      expect(prev.body.mapeamento.lojas.colunas).toMatchObject({
        loja_24h: 2,
        abre_seg: 3,
        abre_dom: 7,
      });
      const ok = await reqGe()
        .post(`/api/v1/importacoes/cadastro/${prev.body.id}/confirmar`)
        .set(admin)
        .send({ mapeamento: prev.body.mapeamento });
      expect(ok.body.lojas).toEqual({ novos: 2, atualizados: 0 });
      expect(ok.body.erros[0].motivo).toContain('Horário de segunda inválido');

      const lojas = (await reqGe().get('/api/v1/lojas?pageSize=50').set(admin)).body.data;
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
      const p2 = await reqGe()
        .post('/api/v1/importacoes/cadastro')
        .set(admin)
        .attach('arquivo', Buffer.from(await sem.xlsx.writeBuffer()), 'l2.xlsx');
      await reqGe()
        .post(`/api/v1/importacoes/cadastro/${p2.body.id}/confirmar`)
        .set(admin)
        .send({ mapeamento: p2.body.mapeamento });
      const depois = (await reqGe().get('/api/v1/lojas?pageSize=50').set(admin)).body.data.find(
        (l: { codigo: string }) => l.codigo === '020',
      );
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
      const prev = await reqGe()
        .post('/api/v1/importacoes/cadastro')
        .set(admin)
        .attach('arquivo', Buffer.from(await wb.xlsx.writeBuffer()), 'a.xlsx');
      await reqGe()
        .post(`/api/v1/importacoes/cadastro/${prev.body.id}/confirmar`)
        .set(admin)
        .send({ mapeamento: prev.body.mapeamento });
      const l = (await reqGe().get('/api/v1/lojas?pageSize=50').set(admin)).body.data.find(
        (x: { codigo: string }) => x.codigo === '030',
      );
      expect(l.horariosResumo).toBe('Seg a sex 08:00–22:00 · Sáb 09:00–13:00 · Dom fechada');
    });

    it('recusa fechamento antes da abertura, dia aberto sem horário e semana com dias a menos', async () => {
      const post = (horarios: object) =>
        reqGe().post('/api/v1/lojas').set(admin).send({ codigo: '012', nome: 'Erro', horarios });
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
  describe('dados da loja: cidade, bandeira e regime tributário', () => {
    const base = { codigo: '020', nome: 'Loja Vinte' };
    const criar = (extra: object) =>
      reqGe()
        .post('/api/v1/lojas')
        .set(admin)
        .send({ ...base, ...extra });

    it('grava e devolve cidade, UF, bandeira, CNPJ e regime', async () => {
      const c = await criar({
        cnpj: '11.222.333/0001-81',
        cidade: 'Belo Horizonte',
        uf: 'mg',
        marca: 'Super Popular',
        regimeTributario: 'presumido',
      });
      expect(c.status).toBe(201);
      expect(c.body).toMatchObject({
        cidade: 'Belo Horizonte',
        uf: 'MG',
        marca: 'Super Popular',
        regimeTributario: 'presumido',
      });
      const lido = (await reqGe().get('/api/v1/lojas')).body.data[0];
      expect(lido).toMatchObject({ cidade: 'Belo Horizonte', regimeTributario: 'presumido' });
      const limpo = await reqGe()
        .patch(`/api/v1/lojas/${c.body.id}`)
        .set(admin)
        .send({ regimeTributario: null });
      expect(limpo.body.regimeTributario).toBeNull();
    });

    it('recusa CNPJ inválido, UF inexistente e regime fora das três opções', async () => {
      expect((await criar({ cnpj: '11.222.333/0001-82' })).status).toBe(400);
      expect((await criar({ uf: 'XX' })).status).toBe(400);
      expect((await criar({ regimeTributario: 'mei' })).status).toBe(400);
    });

    it('loja antiga sem cidade nem regime continua abrindo', async () => {
      await prisma.loja.create({ data: { codigo: '021', nome: 'Antiga', geId: GE_INICIAL_ID } });
      const r = await reqGe().get('/api/v1/lojas');
      expect(r.status).toBe(200);
      expect(r.body.data[0].cidade).toBeUndefined();
      expect(r.body.data[0].regimeTributario ?? null).toBeNull();
    });

    it('importa cidade e regime da planilha', async () => {
      const buf = await planilha(
        [['030', 'Loja Trinta', 'Curitiba', 'Lucro Real']],
        [],
        ['Cód_Loja', 'Nome_Loja', 'Cidade', 'Regime tributário'],
      );
      const up = await reqGe()
        .post('/api/v1/importacoes/cadastro')
        .set(admin)
        .attach('arquivo', buf, 'cadastro.xlsx');
      expect(up.status).toBe(201);
      expect(up.body.mapeamento.lojas.colunas).toMatchObject({ cidade: 2, regime_tributario: 3 });
      const conf = await reqGe()
        .post(`/api/v1/importacoes/cadastro/${up.body.id}/confirmar`)
        .set(admin)
        .send({ mapeamento: up.body.mapeamento });
      expect(conf.status).toBe(200);
      const l = await prisma.loja.findFirst({ where: { codigo: '030' } });
      expect(l).toMatchObject({ cidade: 'Curitiba', regimeTributario: 'real' });
    });
  });
  describe('faturamento da loja (só o dono)', () => {
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
    const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };
    const fat = {
      dias: [12000, 12000, 12000, 12000, 15000, 18000, null],
      mensal: 420000,
      margemPct: 28,
    };

    it('o dono grava e lê; gestor e consulta nem recebem o campo', async () => {
      const c = await reqGe()
        .post('/api/v1/lojas')
        .set(admin)
        .send({ codigo: '040', nome: 'Loja Quarenta', faturamento: fat });
      expect(c.status).toBe(201);
      expect(c.body.faturamento).toEqual(fat);
      const dono = (await reqGe().get('/api/v1/lojas').set(admin)).body.data[0];
      expect(dono.faturamento).toEqual(fat);
      for (const perfil of [gestor, consulta]) {
        const l = (await reqGe().get('/api/v1/lojas').set(perfil)).body.data[0];
        expect(l).not.toHaveProperty('faturamento');
        expect(JSON.stringify(l)).not.toContain('420000');
      }
      const ed = await reqGe()
        .patch(`/api/v1/lojas/${c.body.id}`)
        .set(gestor)
        .send({ nome: 'Quarenta Novo' });
      expect(ed.status).toBe(200);
      expect(ed.body).not.toHaveProperty('faturamento');
    });

    it('gestor não consegue gravar faturamento (403) e nada muda', async () => {
      const c = await reqGe()
        .post('/api/v1/lojas')
        .set(admin)
        .send({ codigo: '041', nome: 'Loja Quarenta e Um' });
      const r = await reqGe()
        .patch(`/api/v1/lojas/${c.body.id}`)
        .set(gestor)
        .send({ faturamento: fat });
      expect(r.status).toBe(403);
      expect((await prisma.loja.findUnique({ where: { id: c.body.id } }))?.faturamento).toBeNull();
    });

    it('recusa valor negativo, margem acima de 100 e menos de sete dias', async () => {
      const post = (f: object) =>
        reqGe().post('/api/v1/lojas').set(admin).send({ codigo: '042', nome: 'Y', faturamento: f });
      expect((await post({ ...fat, dias: [-5, 1, 1, 1, 1, 1, 1] })).status).toBe(400);
      expect((await post({ ...fat, margemPct: 150 })).status).toBe(400);
      expect((await post({ ...fat, dias: [1, 2] })).status).toBe(400);
    });

    it('importa o faturamento da planilha só quando quem envia é o dono', async () => {
      const cab = ['Cód_Loja', 'Nome_Loja', 'Fat_Seg', 'Fat_Mensal', 'Margem_Pct'];
      const enviar = async (perfil: Record<string, string>, codigo: string) => {
        const buf = await planilha([[codigo, 'Loja P', '10000', '300000', '25']], [], cab);
        const up = await reqGe()
          .post('/api/v1/importacoes/cadastro')
          .set(perfil)
          .attach('arquivo', buf, 'f.xlsx');
        expect(up.body.mapeamento.lojas.colunas).toMatchObject({
          fat_seg: 2,
          fat_mensal: 3,
          margem_pct: 4,
        });
        const ok = await reqGe()
          .post(`/api/v1/importacoes/cadastro/${up.body.id}/confirmar`)
          .set(perfil)
          .send({ mapeamento: up.body.mapeamento });
        expect(ok.status).toBe(200);
        return prisma.loja.findFirst({ where: { codigo } });
      };
      expect((await enviar(admin, '050'))?.faturamento).toEqual({
        dias: [10000, null, null, null, null, null, null],
        mensal: 300000,
        margemPct: 25,
      });
      expect((await enviar(gestor, '051'))?.faturamento).toBeNull();
    });
  });
  describe('equipe da loja: carga mensal, horário, CPF', () => {
    const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };
    let lojaId: string;
    beforeEach(async () => {
      lojaId = (
        await reqGe()
          .post('/api/v1/lojas')
          .set(admin)
          .send({ codigo: '060', nome: 'Loja Sessenta' })
      ).body.id;
    });
    const novo = (extra: object = {}) =>
      reqGe()
        .post('/api/v1/funcionarios')
        .set(admin)
        .send({ matricula: 'M1', nome: 'Ana Souza', lojaId, funcaoEscala: 'Caixa', ...extra });

    it('guarda carga mensal, horário e dias; a semanal sai da mensal', async () => {
      const r = await novo({
        cargaMensalH: 220,
        entrada: '08:00',
        saida: '17:30',
        dias: [4, 0, 1, 2, 3, 3],
        cpf: '529.982.247-25',
        cargo: 'Caixa',
      });
      expect(r.status).toBe(201);
      expect(r.body).toMatchObject({
        cargaMensalH: 220,
        cargaSemanalH: 44,
        entrada: '08:00',
        saida: '17:30',
        dias: [0, 1, 2, 3, 4],
      });
      const lista = (await reqGe().get(`/api/v1/funcionarios?lojaId=${lojaId}`).set(admin)).body
        .data;
      expect(lista[0]).toMatchObject({ cpf: '529.982.247-25', entrada: '08:00' });
    });

    it('quem só tem carga semanal mostra a mensal equivalente', async () => {
      const r = await novo({ cargaSemanalH: 42 });
      expect(r.body.cargaMensalH).toBe(210);
    });

    it('recusa CPF inválido e repetido na mesma loja; permite o mesmo CPF em outra loja', async () => {
      expect((await novo({ cpf: '529.982.247-26' })).status).toBe(400);
      expect((await novo({ cpf: '529.982.247-25' })).status).toBe(201);
      const dup = await novo({ matricula: 'M2', cpf: '52998224725' });
      expect(dup.status).toBe(409);
      expect(dup.body.error.code).toBe('CPF_DUPLICADO');
      const outra = (
        await reqGe().post('/api/v1/lojas').set(admin).send({ codigo: '061', nome: 'Loja Outra' })
      ).body.id;
      const ok = await reqGe()
        .post('/api/v1/funcionarios')
        .set(admin)
        .send({ matricula: 'M3', nome: 'Bia Lima', lojaId: outra, cpf: '529.982.247-25' });
      expect(ok.status).toBe(201);
    });

    it('recusa saída igual à entrada, entrada sem saída e horário fora do formato', async () => {
      expect((await novo({ entrada: '08:00', saida: '08:00' })).status).toBe(400);
      expect((await novo({ entrada: '08:00' })).status).toBe(400);
      expect((await novo({ entrada: '8h', saida: '17:00' })).status).toBe(400);
    });

    it('edita só o horário e remove (exclusão lógica); sai da lista', async () => {
      const f = await novo({ entrada: '08:00', saida: '17:00', dias: [0, 1] });
      const ed = await reqGe()
        .patch(`/api/v1/funcionarios/${f.body.id}`)
        .set(admin)
        .send({ saida: '18:00' });
      expect(ed.body).toMatchObject({ entrada: '08:00', saida: '18:00' });
      expect(
        (
          await reqGe()
            .patch(`/api/v1/funcionarios/${f.body.id}`)
            .set(admin)
            .send({ saida: '08:00' })
        ).status,
      ).toBe(400);
      expect((await reqGe().delete(`/api/v1/funcionarios/${f.body.id}`).set(admin)).status).toBe(
        204,
      );
      expect((await reqGe().get(`/api/v1/funcionarios?lojaId=${lojaId}`)).body.meta.total).toBe(0);
      expect(
        await prisma.funcionario.count({ where: { id: f.body.id, deletedAt: { not: null } } }),
      ).toBe(1);
    });

    it('busca por nome ou cargo; consulta vê o CPF mascarado', async () => {
      await novo({ cargo: 'Farmacêutica Responsável', cpf: '529.982.247-25' });
      const porCargo = await reqGe()
        .get(`/api/v1/funcionarios?lojaId=${lojaId}&busca=responsavel`)
        .set(admin);
      expect(porCargo.body.meta.total).toBe(0);
      const porCargo2 = await reqGe()
        .get(`/api/v1/funcionarios?lojaId=${lojaId}&busca=Respons`)
        .set(admin);
      expect(porCargo2.body.meta.total).toBe(1);
      const vista = (await reqGe().get(`/api/v1/funcionarios?lojaId=${lojaId}`).set(consulta)).body
        .data[0];
      expect(vista.cpf).toBe('***.982.247-**');
      const gestor = (
        await reqGe()
          .get(`/api/v1/funcionarios?lojaId=${lojaId}`)
          .set({ 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID })
      ).body.data[0];
      expect(gestor.cpf).toBe('529.982.247-25');
    });
  });
});
