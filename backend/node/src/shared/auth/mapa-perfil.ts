import { env } from '../../config/env.js';
import type { Perfil } from '../middlewares/perfil.js';
import type { SessaoRadar } from './radar-session.js';

// Perfil-base da sessão, válido para as rotas de plataforma (sem GE).
// Operador vira PLATFORM_OPERATOR; os demais recebem o perfil de associado (refinado por GE depois).
export const perfilBase = (s: SessaoRadar): Perfil | null => {
  if (s.operador) return 'PLATFORM_OPERATOR';
  if (env.RADAR_PERFIL_ASSOCIADO === 'NENHUM') return null;
  return env.RADAR_PERFIL_ASSOCIADO;
};

// Perfil dentro de um GE específico: dono da loja recebe o perfil de dono; os demais, o de associado.
export const perfilNoGe = (s: SessaoRadar, dono: boolean): Perfil | null => {
  if (s.operador) return 'PLATFORM_OPERATOR';
  if (dono) return env.RADAR_PERFIL_OWNER;
  if (env.RADAR_PERFIL_ASSOCIADO === 'NENHUM') return null;
  return env.RADAR_PERFIL_ASSOCIADO;
};
