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
