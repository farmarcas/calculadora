import { describe, expect, it } from 'vitest';
import { motivosDeDesatualizacao } from './desatualizada.js';

const horarios = { versao: 2, dias: Array.from({ length: 7 }, (_, i) => (i < 5 ? { aberta: true, abre: '08:00', fecha: '20:00' } : { aberta: false })) };
const premissas = { horarios, horariosDaLoja: horarios, minimos: { Farmacêutico: 1 }, convencao8h24: false, regra: 'r40' };
const ana = { matricula: '1', nome: 'Ana', funcao: 'Farmacêutico', cargaH: 40 };
const base = () => ({
  status: 'gravada',
  lojaId: 'L1',
  quadro: [ana],
  premissas,
  hoje: { horarios, minimos: { Farmacêutico: 1 }, convencao8h24: false },
  quadroDeHoje: [{ matricula: '1', nome: 'Ana' }],
  situacao: new Map([['1', { lojaId: 'L1', ativo: true }]]),
});

describe('motivosDeDesatualizacao', () => {
  it('nada mudou: não está desatualizada', () => {
    expect(motivosDeDesatualizacao(base())).toEqual([]);
  });
  it('só gravada pode ficar desatualizada (rascunho e descartada nunca)', () => {
    const mudou = { ...base(), hoje: { ...base().hoje, convencao8h24: true } };
    expect(motivosDeDesatualizacao({ ...mudou, status: 'rascunho' })).toEqual([]);
    expect(motivosDeDesatualizacao({ ...mudou, status: 'descartada' })).toEqual([]);
    expect(motivosDeDesatualizacao(mudou)).toHaveLength(1);
  });
  it('gravada sem retrato (premissas) não é avaliada', () => {
    expect(motivosDeDesatualizacao({ ...base(), premissas: null })).toEqual([]);
  });
  it('entrou gente no quadro da loja', () => {
    const m = motivosDeDesatualizacao({ ...base(), quadroDeHoje: [{ matricula: '1', nome: 'Ana' }, { matricula: '2', nome: 'Bia' }] });
    expect(m).toEqual(['Entrou no quadro da loja: Bia.']);
  });
  it('saiu gente do quadro (desligada ou em outra loja)', () => {
    expect(motivosDeDesatualizacao({ ...base(), situacao: new Map([['1', { lojaId: 'L1', ativo: false }]]) })).toEqual(['Saiu do quadro da loja: Ana.']);
    expect(motivosDeDesatualizacao({ ...base(), situacao: new Map([['1', { lojaId: 'L2', ativo: true }]]) })).toEqual(['Saiu do quadro da loja: Ana.']);
  });
  it('o horário mudou, mas só mudar o formato não conta', () => {
    const outro = { versao: 2, dias: horarios.dias.map((d, i) => (i === 0 ? { aberta: true, abre: '09:00', fecha: '13:00' } : d)) };
    expect(motivosDeDesatualizacao({ ...base(), hoje: { ...base().hoje, horarios: outro } })).toEqual(['O horário de funcionamento da loja mudou.']);
    const antigo = { ...base(), premissas: { ...premissas, horariosDaLoja: { semana: { abre: '08:00', fecha: '20:00' } } }, hoje: { ...base().hoje, horarios: { semana: { abre: '08:00', fecha: '20:00' } } } };
    expect(motivosDeDesatualizacao(antigo)).toEqual([]);
  });
  it('uma simulação que amplia ou reduz horários não fica desatualizada por isso (o que vale é o horário da loja na gravação)', () => {
    const ampliado = { versao: 2, dias: horarios.dias.map((d, i) => (i < 5 ? { aberta: true, abre: '08:00', fecha: '22:00' } : d)) };
    // o horário simulado (premissas.horarios) é outro, mas a loja continua como estava ao gravar
    expect(motivosDeDesatualizacao({ ...base(), premissas: { ...premissas, horarios: ampliado } })).toEqual([]);
    // e se a loja muda depois, aí sim
    const outro = { versao: 2, dias: horarios.dias.map((d, i) => (i === 0 ? { aberta: true, abre: '09:00', fecha: '13:00' } : d)) };
    expect(motivosDeDesatualizacao({ ...base(), premissas: { ...premissas, horarios: ampliado }, hoje: { ...base().hoje, horarios: outro } })).toEqual(['O horário de funcionamento da loja mudou.']);
  });
  it('simulação gravada antes desta regra (sem o horário da loja guardado) não é avisada por horário', () => {
    const { horariosDaLoja: _h, ...semRetrato } = premissas;
    const outro = { versao: 2, dias: horarios.dias.map((d, i) => (i === 0 ? { aberta: true, abre: '09:00', fecha: '13:00' } : d)) };
    expect(motivosDeDesatualizacao({ ...base(), premissas: semRetrato, hoje: { ...base().hoje, horarios: outro } })).toEqual([]);
  });
  it('o mínimo de pessoas e a convenção mudaram', () => {
    expect(motivosDeDesatualizacao({ ...base(), hoje: { ...base().hoje, minimos: { Farmacêutico: 2 } } })).toEqual(['O mínimo de pessoas por função mudou.']);
    expect(motivosDeDesatualizacao({ ...base(), hoje: { ...base().hoje, convencao8h24: true } })).toEqual(['A convenção coletiva (8h24 por dia) mudou.']);
  });
});
