import { describe, expect, it } from 'vitest';
import { apurarDia, sobreposicao, type TurnoPlanejado } from './dia.js';

const turno: TurnoPlanejado = { entrada: 8, saida: 17, iniIntervalo: 12, fimIntervalo: 13 }; // 8h líquidas
const m = (h: number, min = 0) => h * 60 + min;
const tipos = (d: ReturnType<typeof apurarDia>) => d.ocorrencias.map((o) => o.tipo);

describe('apurarDia', () => {
  it('dia cumprido sem ocorrência (dentro da tolerância)', () => {
    const d = apurarDia(turno, [m(8, 5), m(12), m(13), m(17, 3)]);
    expect(d).toMatchObject({
      situacao: 'cumprido',
      realizadoH: 7.97,
      horaExtraH: 0,
      ocorrencias: [],
    });
  });

  it('atraso de 30 min e saída 1h depois: atraso e hora extra estimada', () => {
    const d = apurarDia(turno, [m(8, 30), m(12), m(13), m(18)]);
    expect(tipos(d)).toEqual(['atraso', 'hora_extra']);
    expect(d.ocorrencias[0]!.minutos).toBe(30);
    // 8:30–12 + 13–18 = 3,5 + 5 = 8,5h contra 8h planejadas: 30 min acima da tolerância
    expect(d.realizadoH).toBe(8.5);
    expect(d.horaExtraH).toBe(0.5);
  });

  it('chegou no horário e ficou 1h depois: hora extra de 1h', () => {
    const d = apurarDia(turno, [m(8), m(12), m(13), m(18)]);
    expect(d).toMatchObject({ realizadoH: 9, horaExtraH: 1 });
    expect(tipos(d)).toEqual(['hora_extra']);
  });

  it('saída antecipada e intervalo reduzido', () => {
    const d = apurarDia(turno, [m(8), m(12), m(12, 30), m(16)]);
    expect(tipos(d)).toEqual(['saida_antecipada', 'intervalo_reduzido']);
  });

  it('falta: turno planejado e nenhuma batida; folga normal não é falta', () => {
    expect(apurarDia(turno, [])).toMatchObject({ situacao: 'falta', realizadoH: 0, planejadoH: 8 });
    expect(apurarDia(null, [])).toMatchObject({ situacao: 'folga', ocorrencias: [] });
  });

  it('batidas incompletas: não adivinha, fora de aderência e hora extra', () => {
    const d = apurarDia(turno, [m(8), m(12), m(13)]);
    expect(d).toMatchObject({ situacao: 'incompleto', realizadoH: null });
    expect(tipos(d)).toEqual(['batidas_incompletas']);
  });

  it('trabalho em dia de folga', () => {
    const d = apurarDia(null, [m(10), m(14)]);
    expect(d).toMatchObject({ situacao: 'folga_trabalhada', realizadoH: 4, horaExtraH: 4 });
    expect(tipos(d)).toEqual(['trabalho_em_folga']);
  });

  it('só entrada e saída com intervalo planejado: desconta o intervalo e avisa', () => {
    const d = apurarDia(turno, [m(8), m(17)]);
    expect(d.realizadoH).toBe(8);
    expect(tipos(d)).toEqual(['intervalo_nao_batido']);
  });

  it('sobreposição entre faixas', () => {
    expect(
      sobreposicao(
        [
          [8, 12],
          [13, 17],
        ],
        [[9, 14]],
      ),
    ).toBe(4);
  });
});
