import { describe, expect, it } from 'vitest';
import { papelDoRadar } from './papel.js';
import type { LojaDoRadar, UsuarioDoRadar } from './radar.client.js';

const usuario = (over: Partial<UsuarioDoRadar> = {}): UsuarioDoRadar => ({
  id: '77',
  name: 'Ana',
  email: 'ana@exemplo.com',
  role: { name: 'User' },
  ...over,
});

const loja = (ownerId?: string): LojaDoRadar => ({
  id: '1',
  status: 2,
  owner: ownerId ? { id: ownerId } : null,
});

describe('papel vindo do Radar', () => {
  it.each(['Admin', 'Angel'])('%s é operador', (name) => {
    expect(papelDoRadar(usuario({ role: { name } }))).toEqual({ operador: true });
  });

  it('usuário com ocupação de proprietário é dono do grupo', () => {
    expect(papelDoRadar(usuario({ occupation: 'Proprietário(a)' }))).toEqual({
      operador: false,
      perfil: 'TENANT_ADMIN',
    });
  });

  it('quem o Radar aponta como dono da loja é dono do grupo', () => {
    expect(papelDoRadar(usuario({ stores: [loja('5'), loja('77')] }))).toEqual({
      operador: false,
      perfil: 'TENANT_ADMIN',
    });
  });

  it('o papel Owner do Radar é dono do grupo', () => {
    expect(papelDoRadar(usuario({ role: { name: 'Owner' } }))).toEqual({
      operador: false,
      perfil: 'TENANT_ADMIN',
    });
  });

  it.each(['Farmacêutico(a)', null, undefined])(
    'usuário de loja com ocupação %s só consulta',
    (occupation) => {
      expect(papelDoRadar(usuario({ occupation, stores: [loja('5')] }))).toEqual({
        operador: false,
        perfil: 'SCHEDULE_VIEWER',
      });
    },
  );

  it.each(['INDUSTRY', 'DISTRIBUTOR', 'Supplier', 'Outro'])('%s fica sem acesso', (name) => {
    expect(papelDoRadar(usuario({ role: { name }, occupation: 'Proprietário(a)' }))).toBeNull();
  });
});
