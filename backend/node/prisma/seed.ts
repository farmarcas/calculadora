// Dados FICTÍCIOS para conhecer a Escala (nenhuma pessoa ou loja real). Uso: npm run seed
// Só roda se ainda não houver lojas cadastradas, para nunca misturar com dados da pessoa.
import { prisma } from '../src/shared/database/prisma.js';

const CNPJ_EXEMPLO_MASCARADO = '11.222.333/0001-81';
const VIGENCIA_EXEMPLO = '2026-10-01';

// CPF fictício, mas com os dígitos verificadores certos (o cadastro valida CPF).
const cpfFicticio = (n: number) => {
  const base = String(100_000_000 + n * 7_919).slice(0, 9);
  const dv = (digitos: string, peso: number) => {
    const soma = [...digitos].reduce((t, c, i) => t + Number(c) * (peso - i), 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(base, 10);
  const d2 = dv(base + d1, 11);
  const c = `${base}${d1}${d2}`;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
};
const MATRICULAS = ['F001', 'F006', 'F002', 'F007', 'F003', 'F008', 'F004', 'F005'];
const cpfDeExemplo = (matricula: string) => cpfFicticio(100 + MATRICULAS.indexOf(matricula));

const FUNCIONARIOS: [string, string, string, string, string, number][] = [
  ['F001', 'Ana Souza', '001', 'Farmacêutica', 'Farmacêutico', 40],
  ['F006', 'Rita Alves', '001', 'Farmacêutica', 'Farmacêutico', 40],
  ['F002', 'Bruno Lima', '001', 'Balconista', 'Atendimento', 40],
  ['F007', 'Caio Melo', '001', 'Balconista', 'Atendimento', 40],
  ['F003', 'Carla Dias', '001', 'Caixa', 'Caixa', 40],
  ['F008', 'Davi Prado', '001', 'Caixa', 'Caixa', 40],
  ['F004', 'Diego Reis', '002', 'Auxiliar de estoque', 'Apoio', 40],
  ['F005', 'Elisa Rocha', '002', 'Farmacêutica', 'Farmacêutico', 40],
];

// Mesmo padrão de revezamento nas duas pontas: um turno de manhã e outro até o fechamento.
const TURNOS: [string, number, number, number, number][] = [
  ['F001', 8, 16, 14, 15],
  ['F006', 14, 22, 15, 16],
  ['F002', 8, 16, 14, 15],
  ['F007', 14, 22, 15, 16],
  ['F003', 8, 16, 14, 15],
  ['F008', 14, 22, 15, 16],
];
const PESO_HORA: Record<number, number> = {
  8: 0.5,
  9: 0.8,
  10: 1,
  11: 1.1,
  12: 1.3,
  13: 1,
  14: 0.8,
  15: 0.8,
  16: 1,
  17: 1.4,
  18: 1.9,
  19: 1.8,
  20: 1.1,
  21: 0.5,
};

const main = async () => {
  if ((await prisma.loja.count({ where: { deletedAt: null } })) > 0) {
    process.stdout.write(`Já existem lojas cadastradas: seed ignorado (nada foi alterado).\n`);
    return;
  }
  // Horário no formato por dia (segunda a domingo): a loja 001 abre de segunda a sexta; a 002, também aos sábados.
  const dia = (abre: string, fecha: string) => ({ aberta: true, abre, fecha });
  const fechado = { aberta: false };
  const semana = {
    versao: 2,
    dias: [
      dia('08:00', '22:00'),
      dia('08:00', '22:00'),
      dia('08:00', '22:00'),
      dia('08:00', '22:00'),
      dia('08:00', '22:00'),
      fechado,
      fechado,
    ],
  };
  const l1 = await prisma.loja.create({
    data: {
      codigo: '001',
      nome: 'Farmácia Centro (exemplo)',
      uf: 'SP',
      cnpj: CNPJ_EXEMPLO_MASCARADO,
      horarios: semana,
    },
  });
  const l2 = await prisma.loja.create({
    data: {
      codigo: '002',
      nome: 'Farmácia Norte (exemplo)',
      uf: 'RJ',
      horarios: {
        versao: 2,
        dias: [
          dia('08:00', '20:00'),
          dia('08:00', '20:00'),
          dia('08:00', '20:00'),
          dia('08:00', '20:00'),
          dia('08:00', '20:00'),
          dia('08:00', '14:00'),
          fechado,
        ],
      },
    },
  });
  const lojaId = new Map([
    ['001', l1.id],
    ['002', l2.id],
  ]);
  for (const [matricula, nome, loja, cargo, funcaoEscala, cargaSemanalH] of FUNCIONARIOS)
    await prisma.funcionario.create({
      data: {
        matricula,
        nome,
        cargo,
        funcaoEscala,
        cargaSemanalH,
        cpf: cpfDeExemplo(matricula),
        lojaId: lojaId.get(loja)!,
      },
    });

  const nomes = new Map(FUNCIONARIOS.map((f) => [f[0], f] as const));
  await prisma.carga.create({
    data: {
      lojaId: l1.id,
      tipo: 'ESCALA',
      arquivo: 'exemplo-escala.xlsx',
      linhasAceitas: TURNOS.length,
      linhasRejeitadas: 0,
      turnos: {
        create: TURNOS.map(([m, entrada, saida, ini, fim]) => ({
          matricula: m,
          nome: nomes.get(m)![1],
          funcao: nomes.get(m)![4],
          dias: [0, 1, 2, 3, 4],
          entrada,
          saida,
          iniIntervalo: ini,
          fimIntervalo: fim,
          cargaH: 35,
          status: 'ok',
          cadastrado: true,
        })),
      },
    },
  });

  // Simulação EM USO (já aprovada) para a loja 001, igual à escala atual: é a que o Diagnóstico e as Simulações usam como referência.
  const quadro = TURNOS.map(([m]) => ({
    matricula: m,
    nome: nomes.get(m)![1],
    funcao: nomes.get(m)![4],
    cargaH: 40,
  }));
  await prisma.simulacao.create({
    data: {
      lojaId: l1.id,
      nome: 'Escala atual aprovada (exemplo)',
      status: 'EM_USO',
      regra: 'r40',
      autor: 'TENANT_ADMIN',
      quadro,
      premissas: {
        horarios: semana,
        minimos: { Farmacêutico: 1, Atendimento: 1, Caixa: 1, Apoio: 0, Perfumaria: 0 },
        convencao8h24: false,
        custos: null,
        regra: 'r40',
      },
      resultado: { erros: 0, avisos: 0 },
      gravadaEm: new Date(),
      aprovadaPor: 'TENANT_ADMIN',
      aprovadaEm: new Date(),
      vigenciaInicio: new Date(`${VIGENCIA_EXEMPLO}T00:00:00.000Z`),
      turnos: {
        create: TURNOS.flatMap(([m, entrada, saida, ini, fim]) =>
          [0, 1, 2, 3, 4].map((dia) => ({
            matricula: m,
            dia,
            entrada,
            saida,
            iniIntervalo: ini,
            fimIntervalo: fim,
          })),
        ),
      },
    },
  });

  const vendas = [];
  for (let d = 1; d <= 21; d++)
    for (const [hora, peso] of Object.entries(PESO_HORA))
      vendas.push({
        data: new Date(Date.UTC(2026, 8, d)),
        hora: Number(hora),
        venda: peso * 600,
        margem: peso * 150,
        clientes: Math.round(peso * 20),
        unidades: Math.round(peso * 45),
      });
  await prisma.carga.create({
    data: {
      lojaId: l1.id,
      tipo: 'BASE',
      arquivo: 'exemplo-base-comercial.xlsx',
      linhasAceitas: vendas.length,
      linhasRejeitadas: 0,
      periodoInicio: new Date(Date.UTC(2026, 8, 1)),
      periodoFim: new Date(Date.UTC(2026, 8, 21)),
      vendas: { create: vendas },
    },
  });
  process.stdout.write(
    'Dados de exemplo criados: 2 lojas, 8 funcionários (com CPF fictício), escala atual, simulação em uso e vendas da loja 001.\n',
  );
};

main()
  .catch((e) => {
    process.stderr.write(`${String(e)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
