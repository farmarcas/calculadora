// Migra as escalas já importadas para o Cadastro de funcionários (spec 026).
//   npm run migrar-escala                 ensaio: mostra o que faria e NÃO grava nada
//   npm run migrar-escala -- --aplicar    grava (só nos campos vazios do Cadastro; nunca apaga)
//   npm run migrar-escala -- --aplicar --criar-ausentes   também cria no Cadastro quem está na escala e não tem funcionário
// Na produção (sem tsx): node dist/scripts/migrar-escala.js [--aplicar]
import { prisma } from '../shared/database/prisma.js';
import { executarMigracao } from '../modules/cadastros/migrar-escala.runner.js';

const aplicar = process.argv.includes('--aplicar');
const criarAusentes = process.argv.includes('--criar-ausentes');
const r = await executarMigracao(prisma, { aplicar, criarAusentes });

const linhas = [
  aplicar ? 'MIGRAÇÃO APLICADA' : 'ENSAIO (nada foi gravado; use --aplicar para gravar)',
  '',
  ...r.lojas.flatMap((l) => [
    `Loja ${l.loja} · ${l.nomeLoja}: preenchidos ${l.preenchidos} · já tinham dados ${l.jaTinhamDados} · sem correspondente ${l.semCorrespondente.length}`,
    ...l.semCorrespondente.map(
      (s) =>
        `    sem funcionário no Cadastro: ${s.matricula} (${s.nome})${l.criados > 0 ? ' → criado' : ''}`,
    ),
  ]),
  '',
  `Total: ${r.totais.lojas} loja(s) · preenchidos ${r.totais.preenchidos} · já tinham dados ${r.totais.jaTinhamDados} · sem correspondente ${r.totais.semCorrespondente} · criados ${r.totais.criados}`,
];
process.stdout.write(`${linhas.join('\n')}\n`);
await prisma.$disconnect();
