import { describe, expect, it } from 'vitest';
import { normalizarHorarios, semana24h } from '../cadastros/horarios.js';
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

  describe('horário por dia da semana', () => {
    const aberta = (abre: string, fecha: string) => ({ aberta: true, abre, fecha });
    const semana = (dom: object) => ({
      versao: 2 as const,
      dias: [0, 1, 2, 3, 4, 5].map(() => aberta('08:00', '22:00')).concat([dom as never]),
    });
    const dois = [
      farm('F1', 8, 14, [0, 1, 2, 3, 4, 5, 6], 44),
      farm('F2', 14, 22, [0, 1, 2, 3, 4, 5, 6], 44),
    ];
    const diag = (horarios: object | null, turnos = dois) =>
      montarDiagnostico({
        loja: {
          ...loja,
          horarios: normalizarHorarios(horarios),
          minimos: { Atendimento: 0, Caixa: 0 },
        },
        escala: meta,
        turnos,
        base: null,
        vendas: [],
      });
    const farmRegra = (r: ReturnType<typeof diag>, id: string) => {
      if (r.status === 'pendente') throw new Error('esperava diagnóstico');
      return r.regras.find((x) => x.id === id)!.funcoes.find((f) => f.funcao === 'Farmacêutico')!;
    };

    it('domingo fechado: seis dias de 14h = 84h e 12 turnos; dois farmacêuticos de 44h passam', () => {
      const f = farmRegra(diag(semana({ aberta: false })), 'atual');
      expect(f).toMatchObject({
        necessidadeH: 84,
        necessidadeT: 12,
        capacidadeH: 88,
        saldoH: 4,
        falta: false,
      });
    });

    it('domingo aberto: sete dias = 98h e 14 turnos; os mesmos dois farmacêuticos passam a faltar', () => {
      const f = farmRegra(diag(semana(aberta('08:00', '22:00'))), 'atual');
      expect(f).toMatchObject({
        necessidadeH: 98,
        necessidadeT: 14,
        capacidadeH: 88,
        saldoH: -10,
        saldoT: -2,
        falta: true,
        contratar: 1,
        // 2 turnos faltantes (resto de até 3) viram 1 parcial de 2 turnos; na regra atual o turno tem 44 ÷ 6 = 7,33h
        parcialTurnos: 2,
        parcialH: 14.67,
      });
    });

    it('domingo mais curto (09h às 13h30) soma 4,5h em vez de 14h', () => {
      const f = farmRegra(diag(semana(aberta('09:00', '13:30'))), 'atual');
      expect(f.necessidadeH).toBe(88.5);
    });

    it('loja 24 horas: 168h e 21 turnos por semana, cobertura de 00h a 24h e farmacêutico exigido nas 24h', () => {
      const r = diag(semana24h());
      const f = farmRegra(r, 'atual');
      expect(f).toMatchObject({ necessidadeH: 168, necessidadeT: 21 });
      if (r.status === 'pendente') throw new Error('esperava diagnóstico');
      expect(r.cobertura.horas).toHaveLength(24);
      // F1 cobre 08h–14h e F2 14h–22h em todos os dias: faltam 00h–08h e 22h–24h = 10 faixas sem farmacêutico
      expect(r.numeros.faixasSemFarmaceutico).toBe(10);
      expect(r.loja.horasAbertas).toBe(168);
    });

    it('loja com todos os dias fechados avisa que falta o horário', () => {
      const r = diag({ versao: 2, dias: Array.from({ length: 7 }, () => ({ aberta: false })) });
      expect(r).toMatchObject({ status: 'pendente', mensagem: expect.stringContaining('horário') });
    });
  });
});
