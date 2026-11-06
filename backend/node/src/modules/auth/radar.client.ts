import { z } from 'zod';
import type { ConfigSso } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/logger.js';

const LIMITE_MS = 10_000;

const id = z.union([z.number(), z.string()]).transform(String);

const trocaSchema = z.object({ accessToken: z.string().min(1) });

const lojaSchema = z.object({
  id,
  name: z.string().nullish(),
  cnpj: z.string().nullish(),
  status: z.number(),
  economicGroup: z.object({ id, name: z.string().nullish() }).nullish(),
  owner: z.object({ id }).nullish(),
});

const usuarioSchema = z.object({
  id,
  name: z.string(),
  email: z.string(),
  occupation: z.string().nullish(),
  role: z.object({ name: z.string() }),
  stores: z.array(lojaSchema).nullish(),
});

export type LojaDoRadar = z.infer<typeof lojaSchema>;
export type UsuarioDoRadar = z.infer<typeof usuarioSchema>;

export type RadarClient = {
  trocarCodigo: (code: string) => Promise<string>;
  lerUsuario: (accessToken: string) => Promise<UsuarioDoRadar>;
};

export const radarIndisponivel = () =>
  new AppError('O Radar não respondeu. Tente de novo em instantes.', 503, 'RADAR_INDISPONIVEL');

export const loginInvalido = () =>
  new AppError('Não foi possível confirmar o login. Tente de novo.', 401, 'LOGIN_INVALIDO');

export const radarClient = (sso: ConfigSso): RadarClient => {
  const base = sso.radarAuthUrl.replace(/\/*$/, '/');
  const basic = `Basic ${Buffer.from(`${sso.clientId}:${sso.clientSecret}`).toString('base64')}`;

  const chamar = async (caminho: string, init: RequestInit) => {
    try {
      return await fetch(new URL(caminho, base), {
        ...init,
        signal: AbortSignal.timeout(LIMITE_MS),
      });
    } catch (err) {
      logger.error({ err, caminho }, 'chamada ao Radar falhou');
      throw radarIndisponivel();
    }
  };

  const ler = async <T>(resposta: Response, schema: z.ZodType<T>, caminho: string) => {
    if (resposta.ok) {
      const lido = schema.safeParse(await resposta.json().catch(() => null));
      if (lido.success) return lido.data;
      logger.error({ issues: lido.error.issues, caminho }, 'resposta do Radar fora do esperado');
    } else {
      logger.error({ status: resposta.status, caminho }, 'Radar recusou a chamada');
    }
    throw radarIndisponivel();
  };

  return {
    async trocarCodigo(code) {
      const resposta = await chamar('Sso/Exchange', {
        method: 'POST',
        headers: { Authorization: basic, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, slug: sso.slug }),
      });
      if (resposta.status === 400) throw loginInvalido();
      const troca = await ler(resposta, trocaSchema, 'Sso/Exchange');
      return troca.accessToken;
    },

    async lerUsuario(accessToken) {
      const resposta = await chamar('SessionInfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return ler(resposta, usuarioSchema, 'SessionInfo');
    },
  };
};
