import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../database/prisma.js';
import { GE_INICIAL_ID } from '../ge.js';

// Ajudantes dos testes de integração: criam GEs próprios e limpam o que o teste criou (o GE inicial fica).
export const criarGe = (identificacao: string, nome = `GE ${identificacao}`) =>
  prisma.grupoEconomico.create({ data: { identificacao, nome } });

export const limparGes = async () => {
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
