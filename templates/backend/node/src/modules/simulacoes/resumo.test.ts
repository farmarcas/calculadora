import { describe, expect, it } from 'vitest';
import { nomeDeQuemCriou, tipoDoCenario } from './resumo.js';

describe('tipoDoCenario', () => {
  it('mais horas abertas amplia, menos reduz, igual mantém', () => {
    expect(tipoDoCenario(98, 89)).toBe('amplia');
    expect(tipoDoCenario(77, 89)).toBe('reduz');
    expect(tipoDoCenario(89, 89)).toBe('mantem');
  });
  it('uma diferença só de arredondamento mantém', () => {
    expect(tipoDoCenario(89.001, 89)).toBe('mantem');
  });
});

describe('nomeDeQuemCriou', () => {
  it('mostra o papel em linguagem legível, nunca o código do perfil', () => {
    expect(nomeDeQuemCriou('TENANT_ADMIN')).toBe('Administrador da conta');
    expect(nomeDeQuemCriou('SCHEDULE_MANAGER')).toBe('Gestor de escala');
    expect(nomeDeQuemCriou('SCHEDULE_VIEWER')).toBe('Consulta');
    expect(nomeDeQuemCriou('PLATFORM_OPERATOR')).toBe('Administrador da plataforma');
  });
  it('autor desconhecido ou vazio vira "Sistema"', () => {
    expect(nomeDeQuemCriou('OUTRO')).toBe('Sistema');
    expect(nomeDeQuemCriou(null)).toBe('Sistema');
    expect(nomeDeQuemCriou('TENANT_ADMIN')).not.toMatch(/_/);
  });
});
