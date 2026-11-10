import { env } from '../../config/env.js';
import { logger } from '../logger.js';

// Grupo econômico do usuário, do ponto de vista do Radar.
export type GeDaSessao = {
  radarId: string; // id do GE no Radar (economic_group.Id)
  nome: string;
  dono: boolean; // o usuário é Owner de alguma loja deste GE?
};

export type SessaoRadar = {
  email: string;
  roleType: string; // role.type do /SessionInfo (ex.: 'Associate', 'Admin')
  operador: boolean; // role.type == RADAR_ROLE_OPERATOR_TYPE
  ges: GeDaSessao[];
};

// Cache curto por token: o /SessionInfo é caro e o token vale por 1h.
const cache = new Map<string, { sessao: SessaoRadar; expira: number }>();

const hashToken = (t: string) => {
  // Não guardamos o token em claro; uma chave estável basta para o cache em memória.
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (Math.imul(31, h) + t.charCodeAt(i)) | 0;
  return `${t.length}:${h}`;
};

// Lê um campo aceitando camelCase e PascalCase (o ASP.NET pode serializar de qualquer um dos dois).
const campo = <T = unknown>(obj: unknown, nome: string): T | undefined => {
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as Record<string, unknown>;
  const pascal = nome.charAt(0).toUpperCase() + nome.slice(1);
  return (o[nome] ?? o[pascal]) as T | undefined;
};

const emailDoToken = (token: string): string | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
      'utf8',
    );
    const c = JSON.parse(json) as Record<string, unknown>;
    const email = (c.email ?? c.sub) as string | undefined;
    return email ? email.toLowerCase() : null;
  } catch {
    return null;
  }
};

// Exportada para teste: traduz a resposta do /SessionInfo (+ o token) na sessão da aplicação.
export const montarSessao = (token: string, corpo: unknown): SessaoRadar => {
  const role = campo(corpo, 'role');
  const roleType = String(campo(role, 'type') ?? '');
  const email = (campo<string>(corpo, 'email') ?? emailDoToken(token) ?? '').toLowerCase();

  const stores = (campo<unknown[]>(corpo, 'stores') ?? []) as unknown[];
  // Agrupa as lojas por GE e marca se o usuário é dono de alguma loja do GE.
  const porGe = new Map<string, GeDaSessao>();
  for (const s of stores) {
    const eg = campo(s, 'economicGroup');
    const geId = campo(eg, 'id');
    if (geId === undefined || geId === null) continue;
    const radarId = String(geId);
    const nome = String(campo(eg, 'name') ?? radarId);
    const ownerEmail = String(campo(campo(s, 'owner'), 'email') ?? '').toLowerCase();
    const dono = ownerEmail !== '' && ownerEmail === email;
    const atual = porGe.get(radarId);
    if (atual) atual.dono = atual.dono || dono;
    else porGe.set(radarId, { radarId, nome, dono });
  }

  return {
    email,
    roleType,
    operador: roleType !== '' && roleType === env.RADAR_ROLE_OPERATOR_TYPE,
    ges: [...porGe.values()],
  };
};

// Resolve a sessão a partir do Bearer: valida o token no Radar (o /SessionInfo exige [Authorize],
// então 200 já prova que o token é válido) e devolve perfil-base/GEs. Lança em token inválido.
export const resolverSessao = async (token: string): Promise<SessaoRadar> => {
  const chave = hashToken(token);
  const agora = Date.now();
  const emCache = cache.get(chave);
  if (emCache && emCache.expira > agora) return emCache.sessao;

  const base = env.RADAR_AUTH_URL!.replace(/\/$/, '');
  let resp: Response;
  try {
    resp = await fetch(`${base}/SessionInfo`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    logger.error({ err }, 'falha ao consultar o /SessionInfo do Radar');
    throw new SessaoIndisponivel();
  }

  if (resp.status === 200) {
    const corpo = await resp.json().catch(() => ({}));
    const sessao = montarSessao(token, corpo);
    cache.set(chave, { sessao, expira: agora + env.AUTH_SESSION_TTL_SECONDS * 1000 });
    return sessao;
  }
  // Qualquer coisa diferente de 200 é tratada como não autenticado (o Radar devolve 500, não 401).
  if (resp.status >= 500 && resp.status !== 500) throw new SessaoIndisponivel();
  throw new TokenInvalido();
};

export class TokenInvalido extends Error {}
export class SessaoIndisponivel extends Error {}
