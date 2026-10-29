import { describe, expect, it } from 'vitest';
import { lerDia, lerSemana } from './horarios-relatorio.js';

describe('horário do relatório da plataforma', () => {
  it('lê "07 - 20" como abertura e fechamento', () => {
    expect(lerDia('07 - 20').dia).toEqual({ aberta: true, abre: '07:00', fecha: '20:00' });
    expect(lerDia('7 - 9').dia).toEqual({ aberta: true, abre: '07:00', fecha: '09:00' });
  });

  it('"07 - 00" fecha à meia-noite; "00 - 00" e vazio são fechado', () => {
    expect(lerDia('07 - 00').dia).toEqual({ aberta: true, abre: '07:00', fecha: '24:00' });
    expect(lerDia('00 - 00').dia).toEqual({ aberta: false });
    expect(lerDia('').dia).toEqual({ aberta: false });
    expect(lerDia(null).dia).toEqual({ aberta: false });
    expect(lerDia('00 - 00').aviso).toBeUndefined();
  });

  it('"00 - 24" é 24 horas; "00 - 23" é uma faixa comum', () => {
    expect(lerDia('00 - 24').dia).toEqual({
      aberta: true,
      h24: true,
      abre: '00:00',
      fecha: '24:00',
    });
    expect(lerDia('00 - 23').dia).toEqual({ aberta: true, abre: '00:00', fecha: '23:00' });
  });

  it('descarta minutos e segundos', () => {
    expect(lerDia('07:00:58 - 20:00:58').dia).toEqual({
      aberta: true,
      abre: '07:00',
      fecha: '20:00',
    });
  });

  it('fechamento antes da abertura passa da meia-noite: vai até 24:00 e avisa', () => {
    const r = lerDia('07 - 01');
    expect(r.dia).toEqual({ aberta: true, abre: '07:00', fecha: '24:00' });
    expect(r.aviso).toContain('meia-noite');
  });

  it('horário incompleto ou inválido deixa o dia fechado e avisa', () => {
    for (const t of ['08 - ', ' - ', '25 - 30', 'abc']) {
      const r = lerDia(t);
      expect(r.dia).toEqual({ aberta: false });
      expect(r.aviso).toBeDefined();
    }
  });

  it('semana sem nenhum dia aberto não tem horário', () => {
    expect(lerSemana(Array(7).fill('00 - 00')).horarios).toBeUndefined();
    expect(lerSemana(Array(7).fill(null)).horarios).toBeUndefined();
    const s = lerSemana(['07 - 20', '07 - 20', '07 - 20', '07 - 20', '07 - 20', '07 - 19', null]);
    expect(s.horarios?.dias).toHaveLength(7);
    expect(s.horarios?.dias[6]).toEqual({ aberta: false });
    expect(s.avisos).toEqual([]);
  });
});
