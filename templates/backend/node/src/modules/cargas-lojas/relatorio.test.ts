import { describe, expect, it } from 'vitest';
import type { Aba } from '../planilhas/leitor.js';
import { achaAba, lerRelatorio, mapearColunas } from './relatorio.js';

const CAB = [
  'Bandeira',
  'CNPJ',
  'Apelido de Loja',
  'Status',
  'Regime Tributário',
  'Id',
  'Cidade - Endereço Receita',
  'Estado - Endereço Receita',
  'Grupo Econômico',
  'Anjo Responsavel',
  'Nome do responsável pelo GE',
  'SEGUNDA',
  'TERÇA',
  'QUARTA',
  'QUINTA',
  'SEXTA',
  'SABADO',
  'DOMINGO',
];
const linha = (o: Record<string, string>) => {
  const base: Record<string, string> = {
    Bandeira: 'Ultra Popular',
    CNPJ: '11222333000181',
    'Apelido de Loja': '',
    Status: 'Ativado',
    'Regime Tributário': 'Simples',
    Id: '10',
    'Cidade - Endereço Receita': 'ORLEANS',
    'Estado - Endereço Receita': 'SC',
    'Grupo Econômico': '250',
    'Anjo Responsavel': 'Fulana',
    'Nome do responsável pelo GE': 'Beltrano',
    SEGUNDA: '07 - 20',
    TERÇA: '07 - 20',
    QUARTA: '07 - 20',
    QUINTA: '07 - 20',
    SEXTA: '07 - 20',
    SABADO: '07 - 19',
    DOMINGO: '',
  };
  return CAB.map((c) => ({ ...base, ...o })[c] ?? '');
};
const aba = (...ls: Record<string, string>[]): Aba => ({
  nome: 'lojas',
  cabecalhos: CAB,
  linhas: ls.map(linha),
});

describe('relatório de lojas da plataforma', () => {
  it('acha as colunas pelo título (sem acento nem caixa) e diz o que falta', () => {
    expect(mapearColunas(CAB).faltam).toEqual([]);
    expect(mapearColunas(['cnpj', 'STATUS']).faltam).toEqual(['Grupo Econômico']);
    expect(achaAba([{ nome: 'Como preencher', cabecalhos: ['x'], linhas: [] }, aba()])?.nome).toBe(
      'lojas',
    );
    expect(achaAba([{ nome: 'x', cabecalhos: ['a'], linhas: [] }])).toBeNull();
  });

  it('só Ativado vira loja; os outros status são contados e não criam nada', () => {
    const r = lerRelatorio(
      aba(
        {},
        { Status: 'Desativado', CNPJ: '28927087000247' },
        { Status: 'Montando', CNPJ: '' },
        { Status: 'Transição', CNPJ: '15839321000313' },
        { Status: 'Desativado', CNPJ: '' },
      ),
    );
    expect(r.linhas).toHaveLength(1);
    expect(r.ignoradasPorStatus).toEqual({ Desativado: 2, Montando: 1, Transição: 1 });
    expect(r.rejeitadas).toEqual([]);
    expect(r.ignoradasCnpj).toMatchObject({
      '28927087000247': 'Desativado',
      '15839321000313': 'Transição',
    });
  });

  it('monta a loja: código = Id, nome pelo apelido ou bandeira + cidade, GE e responsável', () => {
    const [a, b] = lerRelatorio(
      aba({}, { 'Apelido de Loja': 'AC FARMA MATRIZ', CNPJ: '06787293000185', Id: '11' }),
    ).linhas;
    expect(a).toMatchObject({
      geIdentificacao: '250',
      geResponsavel: 'Beltrano',
      codigo: '10',
      cnpj: '11222333000181',
    });
    expect(a!.dados).toMatchObject({
      nome: 'Ultra Popular ORLEANS/SC',
      cidade: 'ORLEANS',
      uf: 'SC',
      marca: 'Ultra Popular',
      regimeTributario: 'simples',
    });
    expect(a!.dados.horarios?.dias[6]).toEqual({ aberta: false });
    expect(b!.dados.nome).toBe('AC FARMA MATRIZ');
  });

  it('completa o zero à esquerda do CNPJ que o Excel tirou', () => {
    expect(lerRelatorio(aba({ CNPJ: '6787293000185' })).linhas[0]!.cnpj).toBe('06787293000185');
  });

  it('rejeita CNPJ ausente, inválido, repetido, sem grupo e Id repetido no grupo, com a linha', () => {
    const r = lerRelatorio(
      aba(
        { CNPJ: '' },
        { CNPJ: '11222333000182' },
        {},
        { CNPJ: '11222333000181', Id: '99' },
        { CNPJ: '06787293000185', 'Grupo Econômico': '' },
        { CNPJ: '15839321000313', Id: '10' },
      ),
    );
    expect(r.linhas).toHaveLength(1);
    expect(r.rejeitadas.map((x) => [x.linha, x.motivo])).toEqual([
      [2, 'CNPJ ausente'],
      [3, 'CNPJ inválido'],
      [5, 'CNPJ repetido no arquivo (já na linha 4)'],
      [6, 'Grupo Econômico ausente'],
      [7, 'Id 10 repetido no mesmo grupo do arquivo'],
    ]);
  });

  it('o mesmo Id em grupos diferentes é permitido', () => {
    const r = lerRelatorio(aba({}, { CNPJ: '06787293000185', 'Grupo Econômico': '300' }));
    expect(r.linhas).toHaveLength(2);
  });

  it('conta as pendências: sem regime, sem horário e horário ajustado', () => {
    const r = lerRelatorio(
      aba(
        { 'Regime Tributário': '' },
        {
          CNPJ: '06787293000185',
          Id: '2',
          SEGUNDA: '',
          TERÇA: '',
          QUARTA: '',
          QUINTA: '',
          SEXTA: '',
          SABADO: '',
          DOMINGO: '',
        },
        { CNPJ: '15839321000313', Id: '3', SEGUNDA: '07 - 01' },
      ),
    );
    expect(r.pendencias).toEqual({ semRegime: 1, semHorario: 1, horarioAjustado: 1 });
    expect(r.linhas[1]!.dados.horarios).toBeUndefined();
    expect(r.linhas[2]!.avisos[0]).toContain('meia-noite');
  });
});
