import { describe, expect, it } from 'vitest';
import { lerEnv, ssoDe } from './env.js';

const base = { DATABASE_URL: 'postgresql://u:s@h:5432/b' };
const sso = {
  SSO_HABILITADO: 'true',
  RADAR_AUTH_URL: 'https://auth.exemplo',
  SSO_CLIENT_ID: 'calculadora',
  SSO_CLIENT_SECRET: 'segredo',
  JWT_SEGREDO: 'x'.repeat(32),
};

describe('variáveis do login', () => {
  it('fica desligado por padrão fora de produção', () => {
    expect(ssoDe(lerEnv({ ...base, NODE_ENV: 'development' }))).toBeNull();
  });

  it('aceita variável vazia com o login desligado', () => {
    expect(ssoDe(lerEnv({ ...base, RADAR_AUTH_URL: '', JWT_SEGREDO: '' }))).toBeNull();
  });

  it('recusa produção com o login desligado', () => {
    expect(() => lerEnv({ ...base, NODE_ENV: 'production' })).toThrow('SSO_HABILITADO');
  });

  it.each(['RADAR_AUTH_URL', 'SSO_CLIENT_ID', 'SSO_CLIENT_SECRET', 'JWT_SEGREDO'])(
    'diz qual variável falta: %s',
    (nome) => {
      expect(() => lerEnv({ ...base, ...sso, NODE_ENV: 'production', [nome]: undefined })).toThrow(
        nome,
      );
    },
  );

  it('recusa segredo curto', () => {
    expect(() => lerEnv({ ...base, ...sso, JWT_SEGREDO: 'curto' })).toThrow('32 caracteres');
  });

  it('marca o cookie como seguro em produção', () => {
    const config = ssoDe(lerEnv({ ...base, ...sso, NODE_ENV: 'production' }));
    expect(config).toMatchObject({ cookieSeguro: true, slug: 'Calculadora', sessaoHoras: 8 });
  });
});
