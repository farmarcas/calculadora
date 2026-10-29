import ExcelJS from 'exceljs';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';
import { gerarCpfFicticio } from './util.js';

export const admin = { 'X-Perfil': 'TENANT_ADMIN' };
export const CNPJ = '11.222.333/0001-81';
export const CNPJ_DIGITOS = '11222333000181';
export const CPF_ANA = gerarCpfFicticio(11);
export const CPF_BIA = gerarCpfFicticio(22);
export const CPF_DESCONHECIDO = gerarCpfFicticio(33);

export const limparTudo = async () => {
  await prisma.auditoria.deleteMany();
  await prisma.batida.deleteMany();
  await prisma.importacaoPonto.deleteMany();
  await prisma.simulacao.deleteMany();
  await prisma.carga.deleteMany();
  await prisma.funcionario.deleteMany();
  await prisma.loja.deleteMany();
};

const planilhaEscala = async () => {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('E').addRows([
    [
      'Cod_Loja',
      'ID_Colaborador',
      'Nome_Colaborador',
      'Funcao',
      'Dias_Trabalho',
      'Hora_Entrada',
      'Inicio_Intervalo',
      'Fim_Intervalo',
      'Hora_Saida',
      'Carga_Horaria',
    ],
    ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sex', '08:00', '', '', '14:00', '40'],
    ['001', 'F2', 'Bia', 'Farmacêutica', 'Seg a Sex', '14:00', '', '', '20:00', '40'],
  ]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};

// Loja 001 (CNPJ cadastrado), Ana e Bia com CPF, e uma simulação de 40h gravada e EM USO desde 01/10/2026.
export const montarLojaComSimulacaoEmUso = async (opcoes: { cnpj?: string | null } = {}) => {
  const cnpj = opcoes.cnpj === undefined ? CNPJ : opcoes.cnpj;
  const loja = (
    await request(app)
      .post('/api/v1/lojas')
      .set(admin)
      .send({
        codigo: '001',
        nome: 'Centro',
        ...(cnpj ? { cnpj } : {}),
        horarios: {
          versao: 2,
          dias: [0, 1, 2, 3, 4]
            .map(() => ({ aberta: true, abre: '08:00', fecha: '20:00' }))
            .concat([{ aberta: false } as never, { aberta: false } as never]),
        },
      })
  ).body;
  await request(app)
    .put(`/api/v1/lojas/${loja.id}/configuracao`)
    .set(admin)
    .send({ minimos: { Atendimento: 0, Caixa: 0 } });
  for (const [m, nome, cpf] of [
    ['F1', 'Ana', CPF_ANA],
    ['F2', 'Bia', CPF_BIA],
  ] as const)
    await request(app).post('/api/v1/funcionarios').set(admin).send({
      matricula: m,
      nome,
      lojaId: loja.id,
      cpf,
      funcaoEscala: 'Farmacêutico',
      cargaSemanalH: 40,
    });
  await request(app)
    .post('/api/v1/cargas/escala')
    .set(admin)
    .attach('arquivo', await planilhaEscala(), 'e.xlsx');
  const sim = (
    await request(app)
      .post(`/api/v1/lojas/${loja.id}/simulacoes`)
      .set(admin)
      .send({ nome: 'Plano em uso', regra: 'r40' })
  ).body;
  await request(app).post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
  const aprovada = await request(app)
    .post(`/api/v1/simulacoes/${sim.id}/aprovar`)
    .set(admin)
    .send({ vigenciaInicio: '2026-10-01' });
  return { loja, simulacao: aprovada.body };
};
