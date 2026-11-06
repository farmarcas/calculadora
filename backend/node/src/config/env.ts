import { config } from 'dotenv';
import { z } from 'zod';

config();

const OBRIGATORIAS_DO_SSO = [
  'RADAR_AUTH_URL',
  'SSO_CLIENT_ID',
  'SSO_CLIENT_SECRET',
  'JWT_SEGREDO',
] as const;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().url(),
    SSO_HABILITADO: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    RADAR_AUTH_URL: z.string().url().optional(),
    SSO_CLIENT_ID: z.string().optional(),
    SSO_CLIENT_SECRET: z.string().optional(),
    SSO_SLUG: z.string().default('Calculadora'),
    JWT_SEGREDO: z.string().min(32, 'JWT_SEGREDO precisa ter ao menos 32 caracteres').optional(),
    SESSAO_HORAS: z.coerce.number().positive().default(8),
  })
  .superRefine((e, ctx) => {
    if (e.NODE_ENV === 'production' && !e.SSO_HABILITADO)
      ctx.addIssue({
        code: 'custom',
        path: ['SSO_HABILITADO'],
        message: 'Em produção o login é obrigatório: defina SSO_HABILITADO=true',
      });
    if (!e.SSO_HABILITADO) return;
    for (const nome of OBRIGATORIAS_DO_SSO)
      if (!e[nome]) ctx.addIssue({ code: 'custom', path: [nome], message: `Defina ${nome}` });
  });

export const lerEnv = (fonte: NodeJS.ProcessEnv) =>
  envSchema.parse(Object.fromEntries(Object.entries(fonte).filter(([, valor]) => valor !== '')));

export type Env = ReturnType<typeof lerEnv>;

export type ConfigSso = {
  radarAuthUrl: string;
  clientId: string;
  clientSecret: string;
  slug: string;
  jwtSegredo: string;
  sessaoHoras: number;
  cookieSeguro: boolean;
};

export const ssoDe = (e: Env): ConfigSso | null =>
  e.SSO_HABILITADO
    ? {
        radarAuthUrl: e.RADAR_AUTH_URL!,
        clientId: e.SSO_CLIENT_ID!,
        clientSecret: e.SSO_CLIENT_SECRET!,
        slug: e.SSO_SLUG,
        jwtSegredo: e.JWT_SEGREDO!,
        sessaoHoras: e.SESSAO_HORAS,
        cookieSeguro: e.NODE_ENV === 'production',
      }
    : null;

export const env = lerEnv(process.env);
