export type CampoDef = {
  chave: string;
  rotulo: string;
  obrigatorio: boolean;
  sinonimos: string[];
  exemplo: string;
  // Confere o conteúdo da coluna (0 a 1): ajuda quando o título é ambíguo.
  conteudo?: (valor: string) => boolean;
  // Coluna de planilhas antigas: ainda é entendida na importação, mas não vai no modelo novo.
  legado?: boolean;
};

const reCnpj = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
const reCpf = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const reHora = /^\d{1,2}:\d{2}(:\d{2})?$/;

// Horário por dia: o conteúdo da coluna pode ser HH:MM, "Fechada" ou "24h".
export const ehHoraOuMarca = (v: string) =>
  reHora.test(v) || /^(\d{1,2}|fechad[oa]|24\s?h(oras?|s)?|-)$/i.test(v.trim());

// chave, nome completo, apelidos aceitos nos títulos das colunas
const DIAS_PLANILHA: [string, string, string[]][] = [
  ['seg', 'segunda', ['seg', 'segunda', 'segunda feira']],
  ['ter', 'terça', ['ter', 'terca', 'terca feira']],
  ['qua', 'quarta', ['qua', 'quarta', 'quarta feira']],
  ['qui', 'quinta', ['qui', 'quinta', 'quinta feira']],
  ['sex', 'sexta', ['sex', 'sexta', 'sexta feira']],
  ['sab', 'sábado', ['sab', 'sabado']],
  ['dom', 'domingo', ['dom', 'domingo']],
];
const EXEMPLO_ABRE = ['08:00', '08:00', '08:00', '08:00', '08:00', '08:00', 'Fechada'];
const EXEMPLO_FECHA = ['22:00', '22:00', '22:00', '22:00', '22:00', '20:00', 'Fechada'];

export const CAMPOS_HORARIO_DIA: CampoDef[] = DIAS_PLANILHA.flatMap(([k, nome, apelidos], i) => [
  {
    chave: `abre_${k}`,
    rotulo: `Abre ${nome}`,
    obrigatorio: false,
    exemplo: EXEMPLO_ABRE[i]!,
    sinonimos: apelidos.flatMap((a) => [
      `abre ${a}`,
      `${a} abre`,
      `abertura ${a}`,
      `${a} abertura`,
      `hora abertura ${a}`,
      `${a} entrada`,
    ]),
    conteudo: ehHoraOuMarca,
  },
  {
    chave: `fecha_${k}`,
    rotulo: `Fecha ${nome}`,
    obrigatorio: false,
    exemplo: EXEMPLO_FECHA[i]!,
    sinonimos: apelidos.flatMap((a) => [
      `fecha ${a}`,
      `${a} fecha`,
      `fechamento ${a}`,
      `${a} fechamento`,
      `hora fechamento ${a}`,
      `${a} saida`,
    ]),
    conteudo: ehHoraOuMarca,
  },
]);

export const CAMPOS_LOJA: CampoDef[] = [
  {
    chave: 'codigo',
    rotulo: 'Código da loja',
    obrigatorio: true,
    exemplo: '001',
    sinonimos: [
      'codigo',
      'cod loja',
      'cod_loja',
      'codigo da loja',
      'codigo filial',
      'filial',
      'loja n',
      'numero da loja',
      'id loja',
    ],
  },
  {
    chave: 'nome',
    rotulo: 'Nome da loja',
    obrigatorio: true,
    exemplo: 'Loja Exemplo',
    sinonimos: [
      'nome',
      'nome loja',
      'nome_loja',
      'nome da loja',
      'loja',
      'razao social',
      'fantasia',
      'descricao',
    ],
  },
  {
    chave: 'cnpj',
    rotulo: 'CNPJ',
    obrigatorio: false,
    exemplo: '00.000.000/0001-00',
    sinonimos: ['cnpj', 'cnpj loja', 'documento'],
    conteudo: (v) => reCnpj.test(v),
  },
  {
    chave: 'uf',
    rotulo: 'UF',
    obrigatorio: false,
    exemplo: 'SP',
    sinonimos: ['uf', 'estado', 'sigla estado'],
    conteudo: (v) => /^[A-Za-z]{2}$/.test(v),
  },
  {
    chave: 'marca',
    rotulo: 'Marca',
    obrigatorio: false,
    exemplo: 'Rede Exemplo',
    sinonimos: ['marca', 'bandeira', 'rede'],
  },
  {
    chave: 'loja_24h',
    rotulo: 'Loja 24 horas (Sim/Não)',
    obrigatorio: false,
    exemplo: 'Não',
    sinonimos: [
      'loja 24h',
      'loja 24 horas',
      '24h',
      '24 horas',
      'funciona 24h',
      'aberta 24h',
      '24 hs',
      '24x7',
    ],
    conteudo: (v) => /^(sim|nao|não|s|n|x|true|false|1|0)$/i.test(v),
  },
  ...CAMPOS_HORARIO_DIA,
  // Planilhas antigas: uma abertura e um fechamento para segunda a sexta.
  {
    chave: 'abre_semana',
    rotulo: 'Abre (seg a sex)',
    obrigatorio: false,
    legado: true,
    exemplo: '08:00',
    sinonimos: [
      'abre semana',
      'abertura semana',
      'abre seg sex',
      'hora abertura',
      'abertura',
      'abre',
      'inicio semana',
    ],
    conteudo: (v) => reHora.test(v),
  },
  {
    chave: 'fecha_semana',
    rotulo: 'Fecha (seg a sex)',
    obrigatorio: false,
    legado: true,
    exemplo: '22:00',
    sinonimos: [
      'fecha semana',
      'fechamento semana',
      'fecha seg sex',
      'hora fechamento',
      'fechamento',
      'fecha',
      'fim semana',
    ],
    conteudo: (v) => reHora.test(v),
  },
];

export const CAMPOS_FUNCIONARIO: CampoDef[] = [
  {
    chave: 'matricula',
    rotulo: 'Matrícula',
    obrigatorio: true,
    exemplo: 'F0001',
    sinonimos: [
      'matricula',
      'id colaborador',
      'id_colaborador',
      'id funcionario',
      'codigo colaborador',
      'registro',
      'chapa',
    ],
  },
  {
    chave: 'nome',
    rotulo: 'Nome',
    obrigatorio: true,
    exemplo: 'Maria Exemplo',
    sinonimos: [
      'nome',
      'nome colaborador',
      'nome_colaborador',
      'nome funcionario',
      'colaborador',
      'funcionario',
    ],
  },
  {
    chave: 'loja',
    rotulo: 'Código da loja de lotação',
    obrigatorio: true,
    exemplo: '001',
    sinonimos: [
      'loja',
      'cod loja',
      'cod_loja',
      'codigo da loja',
      'loja lotacao',
      'lotacao',
      'filial',
      'codigo filial',
    ],
  },
  {
    chave: 'cpf',
    rotulo: 'CPF (fictício)',
    obrigatorio: false,
    exemplo: '000.000.000-00',
    sinonimos: ['cpf', 'documento'],
    conteudo: (v) => reCpf.test(v),
  },
  {
    chave: 'cargo',
    rotulo: 'Cargo',
    obrigatorio: false,
    exemplo: 'Balconista',
    sinonimos: ['cargo', 'funcao', 'ocupacao', 'posicao'],
  },
  {
    chave: 'funcao_escala',
    rotulo: 'Função de escala',
    obrigatorio: false,
    exemplo: 'Atendimento',
    sinonimos: [
      'funcao escala',
      'funcao de escala',
      'funcao_escala',
      'area',
      'setor',
      'departamento',
    ],
  },
  {
    chave: 'carga_semanal',
    rotulo: 'Carga semanal (horas)',
    obrigatorio: false,
    exemplo: '44',
    sinonimos: [
      'carga semanal',
      'carga horaria',
      'carga_horaria',
      'horas semanais',
      'jornada',
      'carga',
    ],
    conteudo: (v) => /^\d{1,2}([.,]\d)?$/.test(v),
  },
  {
    chave: 'regime',
    rotulo: 'Regime',
    obrigatorio: false,
    exemplo: 'CLT',
    sinonimos: ['regime', 'vinculo', 'tipo contrato', 'contrato'],
  },
];

export const FUNCOES_ESCALA = [
  'Farmacêutico',
  'Atendimento',
  'Caixa',
  'Apoio',
  'Perfumaria',
] as const;

export const CAMPOS_ESCALA: CampoDef[] = [
  {
    chave: 'loja',
    rotulo: 'Código da loja',
    obrigatorio: true,
    exemplo: '001',
    sinonimos: ['cod loja', 'cod_loja', 'codigo da loja', 'codigo', 'filial', 'loja'],
  },
  {
    chave: 'matricula',
    rotulo: 'ID do colaborador',
    obrigatorio: true,
    exemplo: 'F0001',
    sinonimos: [
      'id colaborador',
      'id_colaborador',
      'matricula',
      'id funcionario',
      'chapa',
      'registro',
    ],
  },
  {
    chave: 'nome',
    rotulo: 'Nome do colaborador',
    obrigatorio: false,
    exemplo: 'Maria Exemplo',
    sinonimos: ['nome colaborador', 'nome_colaborador', 'nome', 'colaborador', 'funcionario'],
  },
  {
    chave: 'funcao',
    rotulo: 'Função',
    obrigatorio: false,
    exemplo: 'Atendimento',
    sinonimos: ['funcao', 'cargo', 'funcao escala', 'area', 'setor'],
  },
  {
    chave: 'tipo_escala',
    rotulo: 'Tipo de escala',
    obrigatorio: false,
    exemplo: '6x1',
    sinonimos: ['tipo escala atual', 'tipo_escala_atual', 'tipo escala', 'escala', 'regime escala'],
  },
  {
    chave: 'dias',
    rotulo: 'Dias de trabalho',
    obrigatorio: true,
    exemplo: 'Seg a Sáb',
    sinonimos: ['dias trabalho', 'dias_trabalho', 'dias de trabalho', 'dias', 'dias trabalhados'],
  },
  {
    chave: 'folga',
    rotulo: 'Folga semanal',
    obrigatorio: false,
    exemplo: 'Dom',
    sinonimos: ['folga semanal', 'folga_semanal', 'folga', 'dia de folga'],
  },
  {
    chave: 'entrada',
    rotulo: 'Hora de entrada',
    obrigatorio: true,
    exemplo: '08:00',
    sinonimos: ['hora entrada', 'hora_entrada', 'entrada', 'inicio'],
    conteudo: (v) => reHora.test(v),
  },
  {
    chave: 'ini_intervalo',
    rotulo: 'Início do intervalo',
    obrigatorio: false,
    exemplo: '12:00',
    sinonimos: [
      'inicio intervalo',
      'inicio_intervalo',
      'ini intervalo',
      'saida intervalo',
      'almoco inicio',
    ],
    conteudo: (v) => reHora.test(v),
  },
  {
    chave: 'fim_intervalo',
    rotulo: 'Fim do intervalo',
    obrigatorio: false,
    exemplo: '13:00',
    sinonimos: [
      'fim intervalo',
      'fim_intervalo',
      'volta intervalo',
      'retorno intervalo',
      'almoco fim',
    ],
    conteudo: (v) => reHora.test(v),
  },
  {
    chave: 'saida',
    rotulo: 'Hora de saída',
    obrigatorio: true,
    exemplo: '17:00',
    sinonimos: ['hora saida', 'hora_saida', 'saida', 'fim', 'termino'],
    conteudo: (v) => reHora.test(v),
  },
  {
    chave: 'carga',
    rotulo: 'Carga horária semanal',
    obrigatorio: false,
    exemplo: '44',
    sinonimos: ['carga horaria', 'carga_horaria', 'carga semanal', 'horas semanais', 'jornada'],
  },
];

export const CAMPOS_BASE: CampoDef[] = [
  {
    chave: 'data',
    rotulo: 'Data',
    obrigatorio: true,
    exemplo: '2026-09-01',
    sinonimos: ['data', 'dia', 'data venda', 'data_venda'],
  },
  {
    chave: 'hora',
    rotulo: 'Hora',
    obrigatorio: true,
    exemplo: '09:00',
    sinonimos: ['hora', 'hora venda', 'faixa horaria', 'horario'],
  },
  {
    chave: 'loja',
    rotulo: 'Código da loja',
    obrigatorio: true,
    exemplo: '001',
    sinonimos: ['cod loja', 'cod_loja', 'codigo da loja', 'codigo', 'filial', 'loja'],
  },
  {
    chave: 'venda',
    rotulo: 'Venda líquida (R$)',
    obrigatorio: true,
    exemplo: '1250,50',
    sinonimos: [
      'venda liquida rs',
      'venda_liquida_rs',
      'venda liquida',
      'venda',
      'faturamento',
      'valor',
    ],
  },
  {
    chave: 'margem',
    rotulo: 'Margem bruta (R$)',
    obrigatorio: false,
    exemplo: '310,00',
    sinonimos: ['margem bruta rs', 'margem_bruta_rs', 'margem bruta', 'margem', 'lucro bruto'],
  },
  {
    chave: 'clientes',
    rotulo: 'Clientes atendidos',
    obrigatorio: false,
    exemplo: '18',
    sinonimos: ['clientes atendidos', 'clientes_atendidos', 'clientes', 'cupons', 'atendimentos'],
  },
  {
    chave: 'unidades',
    rotulo: 'Unidades vendidas',
    obrigatorio: false,
    exemplo: '42',
    sinonimos: [
      'qtd unidades vendidas',
      'qtd_unidades_vendidas',
      'unidades',
      'itens',
      'quantidade',
    ],
  },
  {
    chave: 'matricula',
    rotulo: 'ID do colaborador',
    obrigatorio: false,
    exemplo: 'F0001',
    sinonimos: ['id colaborador', 'id_colaborador', 'matricula'],
  },
  {
    chave: 'funcao',
    rotulo: 'Função',
    obrigatorio: false,
    exemplo: 'Atendimento',
    sinonimos: ['funcao', 'cargo'],
  },
];
