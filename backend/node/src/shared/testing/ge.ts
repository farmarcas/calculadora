import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../database/prisma.js';
import { GE_INICIAL_ID } from '../ge.js';

// Ajudantes dos testes de integração: criam GEs próprios e limpam o que o teste criou (o GE inicial fica).
export const criarGe = (identificacao: string, nome = `GE ${identificacao}`) =>
  prisma.grupoEconomico.create({ data: { identificacao, nome } });

export const limparGes = async () => {
  const fora = { geId: { not: GE_INICIAL_ID } };
  await prisma.auditoria.deleteMany({ where: fora });
  await prisma.importacaoCadastro.deleteMany({ where: fora });
  await prisma.grupoEconomico.deleteMany({ where: { id: { not: GE_INICIAL_ID } } });
};

export const cabecalhosDoGe = (geId: string, perfil = 'TENANT_ADMIN') => ({
  'X-Perfil': perfil,
  'X-GE': geId,
});

// Como `request(app)`, mas já dentro de um GE (o inicial, se nenhum for dado).
export const reqGe = (geId: string = GE_INICIAL_ID) => {
  const t = request(app);
  return {
    get: (url: string) => t.get(url).set('X-GE', geId),
    post: (url: string) => t.post(url).set('X-GE', geId),
    put: (url: string) => t.put(url).set('X-GE', geId),
    patch: (url: string) => t.patch(url).set('X-GE', geId),
    delete: (url: string) => t.delete(url).set('X-GE', geId),
  };
};

// CNPJ válido e diferente a cada chamada (a loja nova exige CNPJ, e ele é único no sistema).
let sequencia = 10_000_000;
export const cnpjValido = () => {
  const base = `${sequencia++}0001`;
  const digito = (d: string, pesos: number[]) => {
    const r = [...d].reduce((s, c, i) => s + Number(c) * pesos[i]!, 0) % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = digito(base, p1);
  const d2 = digito(`${base}${d1}`, [6, ...p1]);
  return `${base}${d1}${d2}`;
};

// Cria loja pela API como o operador (só ele cria loja), com CNPJ válido se o corpo não trouxer um.
export const postLoja = (body: Record<string, unknown>, geId: string = GE_INICIAL_ID) =>
  reqGe(geId)
    .post('/api/v1/lojas')
    .set('X-Perfil', 'PLATFORM_OPERATOR')
    .send({ cnpj: cnpjValido(), ...body });
