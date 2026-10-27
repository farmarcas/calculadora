import { describe, expect, it } from 'vitest';
import { normalizarHorarios } from '../cadastros/horarios.js';
import { montarDiagnostico, type TurnoDiag } from './diagnostico.js';

const loja = {
  id: 'l1',
  codigo: '001',
  nome: 'Centro',
  // Formato antigo, convertido como o repositório faz ao ler: o teste cobre a conversão também.
  horarios: normalizarHorarios({
    semana: { abre: '08:00', fecha: '20:00' },
    sabado: { abre: '08:00', fecha: '14:00' },
  }),
  convencao8h24: false,
  minimos: { Atendimento: 0, Caixa: 0 },
};
const meta = {
  arquivo: 'e.xlsx',
  recebidaEm: new Date('2026-10-26'),
  linhasAceitas: 2,
  linhasRejeitadas: 0,
};
const farm = (
  m: string,
  entrada: number,
  saida: number,
  dias: number[],
  carga: number,
): TurnoDiag => ({
  funcao: 'Farmacêutico',
  matricula: m,
  nome: m,
  dias,
  entrada,
  saida,
  iniIntervalo: null,
  fimIntervalo: null,
  cargaH: carga,
  status: 'ok',
  motivo: null,
});

describe('montarDiagnostico', () => {
  it('fica pendente sem escala importada', () => {
    const r = montarDiagnostico({ loja, escala: null, turnos: [], base: null, vendas: [] });
    expect(r.status).toBe('pendente');
  });

  it('pede o horário quando a loja não tem', () => {
    const r = montarDiagnostico({
      loja: { ...loja, horarios: null },
      escala: meta,
      turnos: [],
      base: null,
      vendas: [],
    });
    expect(r).toMatchObject({ status: 'pendente', mensagem: expect.stringContaining('horário') });
  });

  it('um farmacêutico sozinho falha na regra atual e aponta horas sem farmacêutico', () => {
    const r = montarDiagnostico({
      loja,
      escala: meta,
      turnos: [farm('F1', 8, 17, [0, 1, 2, 3, 4], 44)],
      base: null,
      vendas: [],
    });
    expect(r.status).toBe('falha_atual');
    if (r.status === 'pendente') throw new Error('esperava diagnóstico');
    expect(r.regras[0]!.passa).toBe(false);
    expect(r.pontosAtencao.some((p) => p.texto.includes('Sem farmacêutico'))).toBe(true);
  });

  it('dois farmacêuticos em revezamento cobrem o horário na regra atual', () => {
    const r = montarDiagnostico({
      loja,
      escala: meta,
      turnos: [farm('F1', 8, 14, [0, 1, 2, 3, 4, 5], 44), farm('F2', 14, 20, [0, 1, 2, 3, 4], 44)],
      base: null,
      vendas: [],
    });
    if (r.status === 'pendente') throw new Error('esperava diagnóstico');
    expect(r.cobertura.funcoes[0]!.porHora.filter((c) => c.ok === false).length).toBe(0);
  });

  it('entrega os números grandes: resumo por regra e pontos de atenção', () => {
    const r = montarDiagnostico({
      loja,
      escala: { ...meta, linhasRejeitadas: 2 },
      turnos: [
        farm('F1', 8, 14, [0, 1, 2, 3, 4, 5], 44),
        farm('F2', 14, 20, [0, 1, 2, 3, 4], 44),
        { ...farm('G', 8, 12, [0], 40), funcao: null },
      ],
      base: null,
      vendas: [],
    });
    if (r.status === 'pendente') throw new Error('esperava diagnóstico');
    expect(r.numeros).toEqual({
      colaboradoresNoCalculo: 2,
      faixasSemFarmaceutico: 0,
      faixasAbaixoDoMinimo: 0,
      maiorVendaDescoberta: null, // sem base comercial
      foraDoCalculo: 1,
      linhasRejeitadas: 2,
    });
    const r40 = r.regras.find((x) => x.id === 'r40')!;
    expect(r40.resumo).toMatchObject({
      turnosEmFalta: expect.any(Number),
      contratar: expect.any(Number),
    });
    expect(r.regras.find((x) => x.id === 'atual')!.resumo.turnosEmFalta).toBe(0);
  });
});
