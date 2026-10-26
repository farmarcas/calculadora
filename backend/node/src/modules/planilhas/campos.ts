export type CampoDef = {
  chave: string;
  rotulo: string;
  obrigatorio: boolean;
  sinonimos: string[];
  exemplo: string;
  // Confere o conteúdo da coluna (0 a 1): ajuda quando o título é ambíguo.
  conteudo?: (valor: string) => boolean;
};

const reCnpj = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
const reCpf = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const reHora = /^\d{1,2}:\d{2}(:\d{2})?$/;

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
    chave: 'abre_semana',
    rotulo: 'Abre (seg a sex)',
    obrigatorio: false,
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
  {
    chave: 'abre_sabado',
    rotulo: 'Abre (sábado)',
    obrigatorio: false,
    exemplo: '08:00',
    sinonimos: ['abre sabado', 'abertura sabado', 'abre sab'],
    conteudo: (v) => reHora.test(v),
  },
  {
    chave: 'fecha_sabado',
    rotulo: 'Fecha (sábado)',
    obrigatorio: false,
    exemplo: '20:00',
    sinonimos: ['fecha sabado', 'fechamento sabado', 'fecha sab'],
    conteudo: (v) => reHora.test(v),
  },
  {
    chave: 'abre_domingo',
    rotulo: 'Abre (domingo)',
    obrigatorio: false,
    exemplo: '09:00',
    sinonimos: ['abre domingo', 'abertura domingo', 'abre dom'],
    conteudo: (v) => reHora.test(v),
  },
  {
    chave: 'fecha_domingo',
    rotulo: 'Fecha (domingo)',
    obrigatorio: false,
    exemplo: '18:00',
    sinonimos: ['fecha domingo', 'fechamento domingo', 'fecha dom'],
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
