import type { Perfil } from '../../shared/middlewares/perfil.js';
import type { UsuarioDoRadar } from './radar.client.js';

const SISTEMA_DA_PERMISSAO = 'Management';
const PERMISSAO_DE_ESCALA = 'ManagementWorkSchedule';

export const PERFIL_DE_QUEM_ENTRA: Perfil = 'TENANT_ADMIN';

export const podeUsarEscala = (usuario: UsuarioDoRadar) =>
  (usuario.permissions ?? []).some(
    (p) => p.farmarcasSystem === SISTEMA_DA_PERMISSAO && p.key === PERMISSAO_DE_ESCALA,
  );
