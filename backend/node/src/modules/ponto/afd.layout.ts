// Layout do AFD (Portaria MTP 671/2021, Anexo V) — conferido em specs/003-ponto-afd/layout-afd.md.
// Todas as posições do arquivo vêm daqui: se o layout mudar, só este arquivo muda.
// Os números são índices a partir de 0 (posição oficial − 1) e o fim é exclusivo.
export const TAMANHO_REGISTRO: Record<string, number> = {
  '1': 302,
  '2': 331,
  '3': 50,
  '4': 73,
  '5': 118,
  '6': 36,
  '7': 137,
  '9': 64,
};

// Tipos com CRC-16 nos 4 últimos caracteres (os tipos 1 a 5).
export const TIPOS_COM_CRC = new Set(['1', '2', '3', '4', '5']);

export const CAMPO = {
  nsr: [0, 9],
  tipo: [9, 10],
  cabecalho: {
    tipoIdEmpregador: [10, 11],
    idEmpregador: [11, 25],
    dataInicial: [206, 216],
    dataFinal: [216, 226],
    geracao: [226, 250],
    versao: [250, 253],
  },
  marcacao: {
    dataHora: [10, 34],
    cpf: [34, 46],
  },
  marcacaoRepP: {
    coletor: [70, 72],
    online: [72, 73],
    hash: [73, 137],
  },
  trailer: {
    // quantidade de registros dos tipos 2, 3, 4, 5, 6 e 7, 9 posições cada
    contagens: [9, 63],
    tipo: [63, 64],
  },
} as const;

export const VERSOES_ACEITAS = new Set(['003', '004']);
export const ASSINATURA_REP_AP = 'ASSINATURA_DIGITAL_EM_ARQUIVO_P7S';
