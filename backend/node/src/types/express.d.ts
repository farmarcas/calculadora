import type { Perfil } from '../shared/middlewares/perfil.js';
import type { SessaoAtiva } from '../shared/middlewares/sessao.js';

declare global {
  namespace Express {
    interface Locals {
      validated?: unknown;
      perfil?: Perfil;
      sessao?: SessaoAtiva;
      lojasPermitidas?: string[];
    }
  }
}

export {};
