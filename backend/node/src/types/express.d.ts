import type { Perfil } from '../shared/middlewares/perfil.js';

declare global {
  namespace Express {
    interface Locals {
      validated?: unknown;
      perfil?: Perfil;
    }
  }
}

export {};
