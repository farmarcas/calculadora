// Dados FICTÍCIOS de ponto para conhecer o Gerenciar (nada é real). Usado pelo seed e pelo comando `npm run afd:exemplo`.
import { gerarAfd, type Marcacao } from './afd.fake.js';
import { gerarCpfFicticio } from './util.js';

export const CNPJ_EXEMPLO_MASCARADO = '11.222.333/0001-81';
export const CNPJ_EXEMPLO = '11222333000181';
export const VIGENCIA_EXEMPLO = '2026-10-01';

const MATRICULAS = ['F001', 'F006', 'F002', 'F007', 'F003', 'F008', 'F004', 'F005'];
export const cpfDeExemplo = (matricula: string) =>
  gerarCpfFicticio(100 + MATRICULAS.indexOf(matricula));
export const CPF_DESCONHECIDO_EXEMPLO = gerarCpfFicticio(999);

// Turnos da loja 001 (segunda a sexta): manhã 08–16 e tarde 14–22, cada um com 1h de intervalo.
const MANHA: [string, string, string, string] = ['08:00', '14:00', '15:00', '16:00'];
const TARDE: [string, string, string, string] = ['14:00', '15:00', '16:00', '22:00'];
const EQUIPE: [string, [string, string, string, string]][] = [
  ['F001', MANHA],
  ['F006', TARDE],
  ['F002', MANHA],
  ['F007', TARDE],
  ['F003', MANHA],
  ['F008', TARDE],
];

const semana = (segunda: string) =>
  [0, 1, 2, 3, 4].map((i) =>
    new Date(
      Date.UTC(
        Number(segunda.slice(0, 4)),
        Number(segunda.slice(5, 7)) - 1,
        Number(segunda.slice(8, 10)) + i,
      ),
    )
      .toISOString()
      .slice(0, 10),
  );

type Ajuste = (
  matricula: string,
  data: string,
  horas: [string, string, string, string],
) => [string, string, string, string] | null;

const marcacoesDaSemana = (segunda: string, ajuste: Ajuste): Marcacao[] =>
  semana(segunda).flatMap((data) =>
    EQUIPE.flatMap(([m, h]) => {
      const horas = ajuste(m, data, h);
      return horas ? horas.map((hora) => ({ cpf: cpfDeExemplo(m), data, hora })) : [];
    }),
  );

// Dois arquivos: a semana de 05/10 (um atraso, uma falta, um CPF desconhecido e a tarde passando 1h do horário)
// e a de 12/10 (hora extra repetida, para disparar o alerta de simulação desatualizada).
export const gerarAfdsDeExemplo = (): { nome: string; conteudo: string }[] => {
  const semana1 = marcacoesDaSemana('2026-10-05', (m, data, h) => {
    if (m === 'F002' && data === '2026-10-06') return ['08:30', h[1], h[2], h[3]]; // Bruno chega 30 min atrasado
    if (m === 'F007' && data === '2026-10-07') return [h[0], h[1], h[2], '23:00']; // Caio fica 1h depois
    if (m === 'F003' && data === '2026-10-08') return null; // Carla falta
    if (m === 'F006' || m === 'F008') return [h[0], h[1], h[2], '23:00']; // a tarde sempre passa 1h do horário
    return h;
  });
  semana1.push({ cpf: CPF_DESCONHECIDO_EXEMPLO, data: '2026-10-07', hora: '09:00' }); // CPF que não está no cadastro
  const semana2 = marcacoesDaSemana('2026-10-12', (m, _d, h) =>
    m === 'F006' || m === 'F007' || m === 'F008' ? [h[0], h[1], h[2], '23:00'] : h,
  );
  const ordenar = (ms: Marcacao[]) =>
    [...ms].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const cabecalho = { cnpj: CNPJ_EXEMPLO, razaoSocial: 'REDE EXEMPLO LTDA' };
  return [
    {
      nome: 'AFD_exemplo_semana1.txt',
      conteudo: gerarAfd({
        ...cabecalho,
        dataInicial: '2026-10-05',
        dataFinal: '2026-10-09',
        marcacoes: ordenar(semana1),
      }),
    },
    {
      nome: 'AFD_exemplo_semana2.txt',
      conteudo: gerarAfd({
        ...cabecalho,
        dataInicial: '2026-10-12',
        dataFinal: '2026-10-16',
        marcacoes: ordenar(semana2),
      }),
    },
  ];
};
