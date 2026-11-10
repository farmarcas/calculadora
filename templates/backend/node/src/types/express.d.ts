import type { Perfil } from '../shared/middlewares/perfil.js';
import type { SessaoAtiva } from '../shared/middlewares/sessao.js';
import type { GePermitido } from '../shared/middlewares/auth.js';
import type { SessaoRadar } from '../shared/auth/radar-session.js';

declare global {
  namespace Express {
    interface Locals {
      validated?: unknown;
      perfil?: Perfil;
      geId?: string;
      sessao?: SessaoAtiva;
      lojasPermitidas?: string[];
      // Preenchidos só no modo 'radar' (login do Radar).
      sessaoRadar?: SessaoRadar;
      gesPermitidos?: GePermitido[];
    }
  }
}

export {};
