import type { Perfil } from '../../shared/middlewares/perfil.js';
import type { UsuarioDoRadar } from './radar.client.js';

export type Papel = { operador: true } | { operador: false; perfil: Perfil };

const PAPEIS_DE_OPERADOR = ['Admin', 'Angel'];
const OCUPACAO_DE_DONO = 'Proprietário(a)';

const ehDono = (usuario: UsuarioDoRadar) =>
  usuario.role.name === 'Owner' ||
  usuario.occupation === OCUPACAO_DE_DONO ||
  (usuario.stores ?? []).some((loja) => loja.owner?.id === usuario.id);

export const papelDoRadar = (usuario: UsuarioDoRadar): Papel | null => {
  if (PAPEIS_DE_OPERADOR.includes(usuario.role.name)) return { operador: true };
  if (usuario.role.name !== 'User' && usuario.role.name !== 'Owner') return null;
  return { operador: false, perfil: ehDono(usuario) ? 'TENANT_ADMIN' : 'SCHEDULE_VIEWER' };
};
