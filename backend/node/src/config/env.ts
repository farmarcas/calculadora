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

    // Como a aplicação descobre quem é o usuário:
    // - 'header'  : confia nos cabeçalhos X-Perfil/X-GE (uso local/testes, sem login real).
    // - 'radar'   : exige o Bearer do login do Radar e resolve perfil/GE pelo /SessionInfo.
    AUTH_MODE: z.enum(['header', 'radar']).default('header'),

    SSO_HABILITADO: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),

    // Base do api-authentication do Radar (service interno do cluster), ex.:
    //   http://api-authentication.api-authentication        (prod)
    //   http://api-authentication-dev.api-authentication-dev (stg)
    RADAR_AUTH_URL: z.string().url().optional(),
    SSO_CLIENT_ID: z.string().optional(),
    SSO_CLIENT_SECRET: z.string().optional(),
    SSO_SLUG: z.string().default('Calculadora'),
    JWT_SEGREDO: z.string().min(32, 'JWT_SEGREDO precisa ter ao menos 32 caracteres').optional(),
    SESSAO_HORAS: z.coerce.number().positive().default(8),

    // Quanto tempo guardar a sessão resolvida por token, para não bater no /SessionInfo a cada request.
    AUTH_SESSION_TTL_SECONDS: z.coerce.number().default(60),

    // Mapa de papéis do Radar -> perfil da calculadora (só no modo 'radar').
    // Valor de role.type do /SessionInfo que vira operador da plataforma.
    RADAR_ROLE_OPERATOR_TYPE: z.string().default('Admin'),
    // Perfil do dono da loja (Owner no /SessionInfo) dentro do seu GE.
    RADAR_PERFIL_OWNER: z.enum(['TENANT_ADMIN', 'SCHEDULE_MANAGER']).default('TENANT_ADMIN'),
    // Perfil dos demais associados com loja no GE (equipe). 'NENHUM' = sem acesso.
    RADAR_PERFIL_ASSOCIADO: z
      .enum(['SCHEDULE_MANAGER', 'SCHEDULE_VIEWER', 'NENHUM'])
      .default('SCHEDULE_VIEWER'),
  })
  .superRefine((e, ctx) => {
    const radar = e.AUTH_MODE === 'radar';
    if (e.NODE_ENV === 'production' && !e.SSO_HABILITADO && !radar)
      ctx.addIssue({
        code: 'custom',
        path: ['SSO_HABILITADO'],
        message: 'Em produção o login é obrigatório: defina SSO_HABILITADO=true ou AUTH_MODE=radar',
      });
    if (e.SSO_HABILITADO && radar)
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_MODE'],
        message: 'Use um login só: SSO_HABILITADO=true ou AUTH_MODE=radar',
      });
    if (radar && !e.RADAR_AUTH_URL)
      ctx.addIssue({
        code: 'custom',
        path: ['RADAR_AUTH_URL'],
        message: 'AUTH_MODE=radar exige RADAR_AUTH_URL (base do api-authentication).',
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
