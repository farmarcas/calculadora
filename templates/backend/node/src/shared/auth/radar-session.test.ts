import { describe, expect, it } from 'vitest';
import { montarSessao } from './radar-session.js';

// JWT (não assinado de verdade; só o payload importa aqui) com email do usuário.
const tokenCom = (email: string) => {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256' })}.${b64({ email })}.sig`;
};

describe('montarSessao (resposta do /SessionInfo)', () => {
  it('extrai os GEs das lojas e marca dono quando o owner é o próprio usuário', () => {
    const token = tokenCom('teste@farmarcas.com.br');
    const s = montarSessao(token, {
      email: 'teste@farmarcas.com.br',
      role: { name: 'User', type: 'Associate' },
      stores: [
        { economicGroup: { id: 280, name: 'GE A' }, owner: { email: 'teste@farmarcas.com.br' } },
        { economicGroup: { id: 628, name: 'GE B' }, owner: { email: 'outro@farmarcas.com.br' } },
      ],
    });
    expect(s.email).toBe('teste@farmarcas.com.br');
    expect(s.operador).toBe(false);
    expect(s.ges).toHaveLength(2);
    expect(s.ges.find((g) => g.radarId === '280')?.dono).toBe(true);
    expect(s.ges.find((g) => g.radarId === '628')?.dono).toBe(false);
  });

  it('aceita PascalCase do ASP.NET e deduplica lojas do mesmo GE', () => {
    const token = tokenCom('dono@farmarcas.com.br');
    const s = montarSessao(token, {
      Email: 'dono@farmarcas.com.br',
      Role: { Name: 'User', Type: 'Associate' },
      Stores: [
        { EconomicGroup: { Id: 280, Name: 'GE A' }, Owner: { Email: 'naodono@x.com' } },
        { EconomicGroup: { Id: 280, Name: 'GE A' }, Owner: { Email: 'dono@farmarcas.com.br' } },
      ],
    });
    expect(s.ges).toHaveLength(1);
    expect(s.ges[0]?.dono).toBe(true); // dono de pelo menos uma loja do GE
  });

  it('marca operador quando o role.type casa com o configurado (Admin)', () => {
    const s = montarSessao(tokenCom('adm@farmarcas.com.br'), {
      email: 'adm@farmarcas.com.br',
      role: { name: 'Admin', type: 'Admin' },
      stores: [],
    });
    expect(s.operador).toBe(true);
  });

  it('cai no email do token quando a resposta não traz email', () => {
    const s = montarSessao(tokenCom('DoToken@Farmarcas.com.br'), {
      role: { type: 'Associate' },
      stores: [],
    });
    expect(s.email).toBe('dotoken@farmarcas.com.br');
  });
});
