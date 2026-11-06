import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),

  // Como a aplicação descobre quem é o usuário:
  // - 'header'  : confia nos cabeçalhos X-Perfil/X-GE (uso local/testes, sem login real).
  // - 'radar'   : exige o Bearer do login do Radar e resolve perfil/GE pelo /SessionInfo.
  AUTH_MODE: z.enum(['header', 'radar']).default('header'),

  // Base do api-authentication do Radar (service interno do cluster), ex.:
  //   http://api-authentication.api-authentication        (prod)
  //   http://api-authentication-dev.api-authentication-dev (stg)
  RADAR_AUTH_URL: z.string().url().optional(),
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
});

const parsed = envSchema.parse(process.env);

if (parsed.AUTH_MODE === 'radar' && !parsed.RADAR_AUTH_URL) {
  throw new Error('AUTH_MODE=radar exige RADAR_AUTH_URL (base do api-authentication).');
}

export const env = parsed;
