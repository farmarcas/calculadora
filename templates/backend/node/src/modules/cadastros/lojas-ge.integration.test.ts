import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { prisma } from '../../shared/database/prisma.js';
import { GE_INICIAL_ID } from '../../shared/ge.js';
import { cnpjValido, criarGe, limparGes, postLoja, reqGe } from '../../shared/testing/ge.js';

const como = (perfil: string) => ({ 'X-Perfil': perfil });
const operador = como('PLATFORM_OPERATOR');
const dono = como('TENANT_ADMIN');
const gestor = como('SCHEDULE_MANAGER');
const consulta = como('SCHEDULE_VIEWER');

const soFuncionarios = async (linhas: string[][]) => {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Quadro').addRows([
    ['ID_Colaborador', 'Nome_Colaborador', 'Cod_Loja', 'Funcao'],
    ...linhas,
  ]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};

describe('lojas por GE: CNPJ e permissões', () => {
  beforeEach(async () => {
    await prisma.auditoria.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    await prisma.importacaoCadastro.deleteMany();
    await limparGes();
  });
  afterAll(async () => {
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    await prisma.importacaoCadastro.deleteMany();
    await limparGes();
    await prisma.$disconnect();
  });

  describe('CNPJ', () => {
    it('aceita com pontuação e guarda só os 14 dígitos', async () => {
      const r = await postLoja({ codigo: '1', nome: 'Loja Um', cnpj: '11.222.333/0001-81' });
      expect(r.status).toBe(201);
      expect(r.body.cnpj).toBe('11222333000181');
      expect((await prisma.loja.findFirstOrThrow()).cnpj).toBe('11222333000181');
    });

    it('é obrigatório e precisa ser válido na loja nova', async () => {
      const semCnpj = await reqGe()
        .post('/api/v1/lojas')
        .set(operador)
        .send({ codigo: '2', nome: 'Loja Dois' });
      expect(semCnpj.status).toBe(400);
      expect(
        (await postLoja({ codigo: '3', nome: 'Loja Três', cnpj: '11.222.333/0001-82' })).status,
      ).toBe(400);
      expect((await postLoja({ codigo: '4', nome: 'Loja Quatro', cnpj: '123' })).status).toBe(400);
    });

    it('não repete, nem entre GEs, e a resposta não diz de quem é', async () => {
      const outro = (await criarGe('LGE-B')).id;
      const cnpj = cnpjValido();
      expect((await postLoja({ codigo: '5', nome: 'Loja Cinco', cnpj })).status).toBe(201);
      for (const ge of [GE_INICIAL_ID, outro]) {
        const r = await postLoja({ codigo: `x${ge.slice(-1)}`, nome: 'Repetida', cnpj }, ge);
        expect(r.status).toBe(409);
        expect(r.body.error.code).toBe('CNPJ_EM_USO');
        expect(r.text).not.toContain(GE_INICIAL_ID);
      }
    });

    it('um CNPJ de loja removida pode ser usado de novo', async () => {
      const cnpj = cnpjValido();
      const a = await postLoja({ codigo: '6', nome: 'Loja Seis', cnpj });
      expect((await reqGe().delete(`/api/v1/lojas/${a.body.id}`).set(operador)).status).toBe(204);
      expect((await postLoja({ codigo: '6', nome: 'Loja Seis', cnpj })).status).toBe(201);
    });
  });

  describe('quem cria, remove e edita a loja', () => {
    it('só o operador cria e remove; dono, gestor e consulta recebem 403', async () => {
      const c = await postLoja({ codigo: '10', nome: 'Loja Dez' });
      for (const perfil of [dono, gestor, consulta]) {
        const cria = await reqGe()
          .post('/api/v1/lojas')
          .set(perfil)
          .send({ codigo: '11', nome: 'X Onze', cnpj: cnpjValido() });
        expect(cria.status).toBe(403);
        expect((await reqGe().delete(`/api/v1/lojas/${c.body.id}`).set(perfil)).status).toBe(403);
      }
      expect(await prisma.loja.count()).toBe(1);
    });

    it('dono e gestor corrigem qualquer dado da loja; consulta não edita', async () => {
      const c = await postLoja({ codigo: '12', nome: 'Loja Doze' });
      const url = `/api/v1/lojas/${c.body.id}`;
      const dados = {
        nome: 'Doze Corrigida',
        cidade: 'Campinas',
        uf: 'SP',
        marca: 'Bandeira Nova',
        regimeTributario: 'presumido',
        horarios: {
          versao: 2,
          dias: Array.from({ length: 7 }, () => ({ aberta: true, abre: '09:00', fecha: '21:00' })),
        },
      };
      const r = await reqGe().patch(url).set(dono).send(dados);
      expect(r.status).toBe(200);
      expect(r.body).toMatchObject({
        nome: 'Doze Corrigida',
        cidade: 'Campinas',
        uf: 'SP',
        marca: 'Bandeira Nova',
        regimeTributario: 'presumido',
      });
      expect((await reqGe().patch(url).set(gestor).send({ cidade: 'Santos' })).status).toBe(200);
      expect((await reqGe().patch(url).set(consulta).send({ cidade: 'Outra' })).status).toBe(403);
      expect((await prisma.loja.findFirstOrThrow()).cidade).toBe('Santos');
    });

    it('o empresário não muda o CNPJ; mandar o mesmo CNPJ (como a tela faz) é aceito', async () => {
      const c = await postLoja({ codigo: '13', nome: 'Loja Treze', cnpj: '11.222.333/0001-81' });
      const url = `/api/v1/lojas/${c.body.id}`;
      const troca = await reqGe().patch(url).set(dono).send({ cnpj: cnpjValido() });
      expect(troca.status).toBe(400);
      expect(troca.body.error.code).toBe('CNPJ_NAO_EDITAVEL');
      expect(
        (
          await reqGe()
            .patch(url)
            .set(dono)
            .send({ cnpj: '11.222.333/0001-81', nome: 'Treze Nova' })
        ).status,
      ).toBe(200);
      expect((await prisma.loja.findFirstOrThrow()).cnpj).toBe('11222333000181');
    });

    it('o operador muda o CNPJ, mas não para um que já existe', async () => {
      const a = await postLoja({ codigo: '14', nome: 'Loja Catorze' });
      const b = await postLoja({ codigo: '15', nome: 'Loja Quinze' });
      const novo = cnpjValido();
      expect(
        (await reqGe().patch(`/api/v1/lojas/${a.body.id}`).set(operador).send({ cnpj: novo }))
          .status,
      ).toBe(200);
      const dup = await reqGe()
        .patch(`/api/v1/lojas/${b.body.id}`)
        .set(operador)
        .send({ cnpj: novo });
      expect(dup.status).toBe(409);
      expect(dup.body.error.code).toBe('CNPJ_EM_USO');
    });

    it('loja antiga sem CNPJ ("pendente"): o dono não preenche, o operador sim', async () => {
      const antiga = await prisma.loja.create({
        data: { geId: GE_INICIAL_ID, codigo: '16', nome: 'Antiga sem CNPJ' },
      });
      const url = `/api/v1/lojas/${antiga.id}`;
      expect((await reqGe().patch(url).set(dono).send({ cnpj: cnpjValido() })).status).toBe(400);
      expect((await reqGe().patch(url).set(dono).send({ nome: 'Antiga Corrigida' })).status).toBe(
        200,
      );
      expect((await reqGe().patch(url).set(operador).send({ cnpj: cnpjValido() })).status).toBe(
        200,
      );
    });

    it('o operador não vê valor em reais nem CPF inteiro', async () => {
      const c = await postLoja({ codigo: '17', nome: 'Loja Dezessete' });
      await reqGe()
        .patch(`/api/v1/lojas/${c.body.id}`)
        .set(dono)
        .send({ faturamento: { dias: [1, 2, 3, 4, 5, 6, 7], mensal: 100, margemPct: 20 } });
      const lojas = (await reqGe().get('/api/v1/lojas').set(operador)).body.data;
      expect(lojas[0]).not.toHaveProperty('faturamento');
      const f = await reqGe()
        .post('/api/v1/funcionarios')
        .set(dono)
        .send({ matricula: 'M1', nome: 'Ana Souza', lojaId: c.body.id, cpf: '529.982.247-25' });
      expect(f.status).toBe(201);
      const vista = (await reqGe().get('/api/v1/funcionarios').set(operador)).body.data[0];
      expect(vista.cpf).not.toContain('529');
    });
  });

  describe('planilha de funcionários só enxerga o GE', () => {
    it('linha de loja de outro GE é rejeitada, e a mesma matrícula vale em GEs diferentes', async () => {
      const outro = (await criarGe('LGE-C')).id;
      await postLoja({ codigo: '100', nome: 'Loja Cem' });
      await postLoja({ codigo: '200', nome: 'Loja Duzentos' }, outro);
      const buf = await soFuncionarios([
        ['F1', 'Ana Souza', '100', 'Caixa'],
        ['F2', 'Bia Lima', '200', 'Caixa'],
      ]);
      const up = await reqGe()
        .post('/api/v1/importacoes/cadastro')
        .set(dono)
        .attach('arquivo', buf, 'f.xlsx');
      expect(up.status).toBe(201);
      const ok = await reqGe()
        .post(`/api/v1/importacoes/cadastro/${up.body.id}/confirmar`)
        .set(dono)
        .send({ mapeamento: up.body.mapeamento });
      expect(ok.status, ok.text + JSON.stringify(up.body.mapeamento)).toBe(200);
      expect(ok.body.funcionarios.novos).toBe(1);
      expect(ok.body.erros[0].motivo).toContain('loja 200 não existe');
      // No outro GE, a matrícula F1 também pode existir.
      const up2 = await reqGe(outro)
        .post('/api/v1/importacoes/cadastro')
        .set(dono)
        .attach('arquivo', await soFuncionarios([['F1', 'Caio Dias', '200', 'Caixa']]), 'g.xlsx');
      const ok2 = await reqGe(outro)
        .post(`/api/v1/importacoes/cadastro/${up2.body.id}/confirmar`)
        .set(dono)
        .send({ mapeamento: up2.body.mapeamento });
      expect(ok2.body.funcionarios.novos).toBe(1);
      expect(await prisma.funcionario.count({ where: { matricula: 'F1' } })).toBe(2);
    });
  });
});
