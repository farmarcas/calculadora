import { jwtVerify, SignJWT } from 'jose';

const chave = (segredo: string) => new TextEncoder().encode(segredo);

export const assinarSessao = (
  sessao: { id: string; radarUsuarioId: string; expiraEm: Date },
  segredo: string,
) =>
  new SignJWT({ sid: sessao.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sessao.radarUsuarioId)
    .setIssuedAt()
    .setExpirationTime(sessao.expiraEm)
    .sign(chave(segredo));

export const sidDoToken = async (token: string, segredo: string) => {
  try {
    const { payload } = await jwtVerify(token, chave(segredo), { algorithms: ['HS256'] });
    return typeof payload.sid === 'string' ? payload.sid : null;
  } catch {
    return null;
  }
};
