import { describe, expect, it } from 'vitest';
import { podeUsarEscala } from './papel.js';
import type { UsuarioDoRadar } from './radar.client.js';

const usuario = (
  permissions: UsuarioDoRadar['permissions'],
  role = 'User',
): UsuarioDoRadar => ({
  id: '77',
  name: 'Ana',
  email: 'ana@exemplo.com',
  role: { name: role },
  permissions,
});

describe('permissão de Escala vinda do Radar', () => {
  it.each(['Admin', 'Angel', 'User'])('%s com Gestão de Escala entra', (role) => {
    expect(
      podeUsarEscala(
        usuario([{ farmarcasSystem: 'Management', key: 'ManagementWorkSchedule' }], role),
      ),
    ).toBe(true);
  });

  it.each([
    ['sem permissões', null],
    ['sem a lista', undefined],
    ['só com o card Escala', [{ farmarcasSystem: 'Management', key: 'AccessWorkSchedule' }]],
    ['com a chave em outro sistema', [{ farmarcasSystem: 'Finance', key: 'ManagementWorkSchedule' }]],
    ['com outra permissão de Gestão', [{ farmarcasSystem: 'Management', key: 'ManagementSchedule' }]],
  ])('não entra %s', (_, permissions) => {
    expect(podeUsarEscala(usuario(permissions, 'Admin'))).toBe(false);
  });
});
