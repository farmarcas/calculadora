import { describe, expect, it } from 'vitest';
import { passa, verificarRegra } from '../regras/capacidade.js';
import { regraPara } from '../regras/perfis.js';
import { montarCenarios, type EntradaCenarios } from './cenarios.js';
import { montarExtras } from './cenarios-extras.js';

const farm = (cargaH: number) => ({ funcao: 'Farmacêutico', cargaH });
const entrada = (extra: Partial<EntradaCenarios> = {}): EntradaCenarios => ({
  regraId: 'r40',
  convencao8h24: false,
  // segunda a sexta, 9h às 17h
  dias: [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 9, fecha: 17 })),
  minimos: { Farmacêutico: 1 },
  pessoas: [farm(40), farm(16)],
  vendas: [],
  custos: { salarioMedio: { Farmacêutico: 10000 }, encargosPct: 0 },
  dono: true,
  ...extra,
});
const estender = (e: EntradaCenarios) => montarExtras(e, montarCenarios(e)).estender;

// Uma linha de venda por dia da semana (2026-03-02 é segunda): margem dada para as horas 9 e 16,
// as pontas do horário 9h–17h. Venda = 4 × margem.
const vendasPontas = (pontas: Record<number, [number, number]>) =>
  Object.entries(pontas).flatMap(([d, [ini, fim]]) =>
    [
      [9, ini],
      [16, fim],
    ].map(([hora, margem]) => ({
      data: `2026-03-0${2 + Number(d)}`,
      hora: hora!,
      venda: margem! * 4,
      margem: margem!,
      clientes: 1,
      unidades: 1,
    })),
  );

describe('Cenário 4 — estender horário', () => {
  // Margem por hora de referência (início, fim): seg 40/30, ter 20/60, qua 10/10, qui 50/25, sex 35/70.
  const vendas = vendasPontas({ 0: [40, 30], 1: [20, 60], 2: [10, 10], 3: [50, 25], 4: [35, 70] });

  it('escolhe pela maior margem de referência, dentro da sobra de turnos e horas', () => {
    // Equipe: farmacêuticos de 40h e 16h = 56h e 7 turnos. A loja usa 40h e 5 turnos (1 por dia).
    // Cada dia que passa de 8h ganha um turno: só dois dias cabem (7 turnos). A venda das horas novas
    // vale 50% da vizinha na 1ª hora e 25% na 2ª. Sexta (70 → 35) e terça (60 → 30) levam a 1ª hora do
    // fim; depois, sem mudar de turno, as demais horas de cada uma.
    const r = estender(entrada({ vendas }));
    expect(r.disponivel).toBe(true);
    expect(r.horasEstender).toBe(8);
    expect(r.horasSemana).toBe(48);
    expect(r.extensoes).toEqual([
      { dia: 1, de: '07:00', ate: '09:00', vendaRef: 60, margemRef: 15 },
      { dia: 1, de: '17:00', ate: '19:00', vendaRef: 180, margemRef: 45 },
      { dia: 4, de: '07:00', ate: '09:00', vendaRef: 105, margemRef: 26.25 },
      { dia: 4, de: '17:00', ate: '19:00', vendaRef: 210, margemRef: 52.5 },
    ]);
    expect(r.horarioSemana[4]).toMatchObject({ abre: '07:00', fecha: '19:00' });
    expect(r.horarioSemana[3]).toMatchObject({ abre: '09:00', fecha: '17:00' });
    // semana: margem 138,75 (15 + 45 + 26,25 + 52,5) e venda 555 → mês × 52 ÷ 12
    expect(r.margemRefMes).toBe(601.25);
    expect(r.vendaRefMes).toBe(2405);
    expect(r.aviso).toContain('referência');
    expect(r.aviso).toContain('5 dias');
  });

  it('o horário estendido continua coberto e uma hora a mais não caberia', () => {
    const e = entrada({ vendas });
    const r = estender(e);
    const dias = r.horarioSemana.flatMap((d) =>
      d.aberto
        ? [
            {
              dia: d.dia,
              abre: Number(d.abre!.slice(0, 2)),
              fecha: Number(d.fecha!.slice(0, 2)),
            },
          ]
        : [],
    );
    const regra = regraPara('r40', false);
    expect(passa(verificarRegra(regra, dias, e.minimos, e.pessoas))).toBe(true);
    // terça e sexta com 12h: mais uma hora em qualquer dia de 8h exigiria o 8º turno
    const mais = dias.map((d) => (d.dia === 3 ? { ...d, fecha: d.fecha + 1 } : d));
    expect(passa(verificarRegra(regra, mais, e.minimos, e.pessoas))).toBe(false);
  });

  it('dono: custo do Cenário 1 e impacto líquido; os outros não recebem valores', () => {
    const dono = estender(entrada({ vendas }));
    expect(dono.custoAdicionalMensal).toBe(0); // equipe atual já cobre: nada a contratar
    expect(dono.impactoMensal).toBe(-601.25);
    const outro = estender(entrada({ vendas, dono: false }));
    expect('custoAdicionalMensal' in outro).toBe(false);
    expect('impactoMensal' in outro).toBe(false);
    expect(outro.extensoes).toEqual(dono.extensoes);
  });

  it('sem base comercial mostra as horas possíveis, sem valor, pelo fim do dia', () => {
    const r = estender(entrada());
    expect(r.disponivel).toBe(true);
    expect(r.horasEstender).toBe(8);
    expect(r.extensoes.map((x) => [x.dia, x.de, x.ate, x.vendaRef])).toEqual([
      [3, '07:00', '09:00', null],
      [3, '17:00', '19:00', null],
      [4, '07:00', '09:00', null],
      [4, '17:00', '19:00', null],
    ]);
    expect(r.margemRefMes).toBeNull();
    expect(r.aviso).toContain('Sem base comercial');
    expect(r.impactoMensal).toBeNull();
  });

  it('usa a sobra das contratações do Cenário 1', () => {
    // 84h abertas (seg–sáb, 8h–22h) e um farmacêutico de 40h: faltam 2 pessoas inteiras
    const e = entrada({
      dias: [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 })),
      pessoas: [farm(40)],
      vendas: [
        ...[0, 1, 2, 3, 4, 5].flatMap((d) => [
          { data: `2026-03-0${2 + d}`, hora: 8, venda: 100, margem: 25, clientes: 1, unidades: 1 },
          { data: `2026-03-0${2 + d}`, hora: 21, venda: 200, margem: 50, clientes: 1, unidades: 1 },
        ]),
      ],
    });
    const c = montarCenarios(e);
    expect(c.manter.pessoasContratar).toBe(2);
    const r = montarExtras(e, c).estender;
    expect(r.disponivel).toBe(true);
    expect(r.horasEstender).toBeGreaterThan(0);
    // sem as vagas a equipe nem cobre o horário atual: só a sobra do Cenário 1 permite estender
    const semVagas = montarExtras(e, { ...c, manter: { ...c.manter, contratacoes: [] } }).estender;
    expect(semVagas.disponivel).toBe(false);
  });

  it('sem sobra de capacidade, explica o motivo', () => {
    const r = estender(entrada({ pessoas: [farm(40)] })); // 40h e 5 turnos para 40h e 5 turnos
    expect(r.disponivel).toBe(false);
    expect(r.motivoIndisponivel).toContain('sobrando');
    expect(r.extensoes).toEqual([]);
    expect(r.horasEstender).toBe(0);
  });

  it('loja 24 horas em todos os dias não tem onde abrir', () => {
    const r = estender(
      entrada({
        dias: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, abre: 0, fecha: 24 })),
        pessoas: Array.from({ length: 6 }, () => farm(40)),
      }),
    );
    expect(r.disponivel).toBe(false);
    expect(r.motivoIndisponivel).toContain('todas as horas possíveis');
  });

  it('com vendas, só estende hora vizinha que tem margem', () => {
    const r = estender(entrada({ vendas: vendasPontas({ 0: [0, 0] }) }));
    expect(r.disponivel).toBe(false);
    expect(r.motivoIndisponivel).toContain('não têm venda');
  });

  it('dia hoje fechado reabre inteiro, com o horário do dia aberto mais curto', () => {
    const mesma = [0, 1, 2, 3, 4].flatMap((d) =>
      Array.from({ length: 8 }, (_, i) => ({
        data: `2026-03-0${2 + d}`,
        hora: 9 + i,
        venda: 40,
        margem: 10,
        clientes: 1,
        unidades: 1,
      })),
    );
    // três farmacêuticos de 40h (120h, 15 turnos) para 40h e 5 turnos: sobra para tudo
    const r = estender(entrada({ pessoas: [farm(40), farm(40), farm(40)], vendas: mesma }));
    expect(r.horarioSemana[5]).toEqual({ dia: 5, aberto: true, abre: '09:00', fecha: '17:00' });
    expect(r.horarioSemana[6]).toEqual({ dia: 6, aberto: true, abre: '09:00', fecha: '17:00' });
    // 5 dias × 4h nas pontas + 2 dias × 8h
    expect(r.horasEstender).toBe(36);
    // margem de referência por semana: pontas 5 dias × (5 + 2,5) × 2 lados = 75; dias reabertos
    // 2 × 8h × (10 × 50%) = 80; total 155 → mês × 52 ÷ 12
    expect(r.margemRefMes).toBe(671.67);
  });
});
