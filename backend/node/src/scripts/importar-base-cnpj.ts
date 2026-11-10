// Carrega a base comercial por CNPJ e dia da semana (spec 036) para as lojas de TODOS os grupos econômicos de uma vez.
// A tela envia um grupo por vez; este comando é para a carga da rede inteira (o arquivo traz lojas de centenas de grupos).
//   npm run importar-base-cnpj -- <arquivo.csv> --inicio 2026-07-01 --fim 2026-10-31            ensaio: NÃO grava nada
//   npm run importar-base-cnpj -- <arquivo.csv> --inicio 2026-07-01 --fim 2026-10-31 --aplicar  grava
// A base anterior de cada loja fica guardada como inativa (nada é apagado) e o Cadastro só recebe o que estava vazio.
// Na produção (sem tsx): node dist/scripts/importar-base-cnpj.js <arquivo.csv> --inicio ... --fim ... [--aplicar]
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { prisma } from '../shared/database/prisma.js';
import {
  erroDoPeriodo,
  interpretarPorCnpj,
  mesclarCadastro,
  faturamentoDaBase,
  soDigitos,
} from '../modules/escala/base-por-cnpj.js';
import { abaPorCnpj, gravarBaseDaLoja } from '../modules/escala/base-por-cnpj.service.js';
import { escalaRepository } from '../modules/escala/escala.repository.js';
import { lerPlanilha } from '../modules/planilhas/leitor.js';

const args = process.argv.slice(2);
const valorDe = (nome: string) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const arquivo = args.find(
  (a, i) => !a.startsWith('--') && !['--inicio', '--fim'].includes(args[i - 1] ?? ''),
);
const inicio = valorDe('--inicio');
const fim = valorDe('--fim');
const aplicar = args.includes('--aplicar');
const sair = (msg: string): never => {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
};

if (!arquivo)
  sair(
    'Informe o arquivo: npm run importar-base-cnpj -- <arquivo.csv> --inicio AAAA-MM-DD --fim AAAA-MM-DD [--aplicar]',
  );
const erroPeriodo = erroDoPeriodo(inicio, fim);
if (erroPeriodo) sair(erroPeriodo);

const nome = basename(arquivo!);
const leitura = abaPorCnpj(await lerPlanilha(readFileSync(arquivo!), nome));
if (!leitura)
  sair(
    'O arquivo não está no formato por CNPJ (precisa das colunas cnpj, dia_semana e faturamento).',
  );
const periodo = { inicio: inicio!, fim: fim! };
const lidas = interpretarPorCnpj(leitura!.aba, leitura!.colunas, periodo);

// Todas as lojas ativas, de qualquer grupo, casadas pelos 14 dígitos do CNPJ.
const todas = await prisma.loja.findMany({
  where: { deletedAt: null },
  select: { id: true, geId: true, codigo: true, nome: true, cnpj: true, faturamento: true },
});
const porDigitos = new Map<string, typeof todas>();
for (const l of todas)
  if (l.cnpj) porDigitos.set(soDigitos(l.cnpj), [...(porDigitos.get(soDigitos(l.cnpj)) ?? []), l]);
const cnpjs = [...lidas.porCnpj.keys()].sort();
const semLoja = cnpjs.filter((c) => !porDigitos.has(c));
const alvos = cnpjs.flatMap((cnpj) => (porDigitos.get(cnpj) ?? []).map((loja) => ({ cnpj, loja })));
const grupos = new Set(alvos.map((a) => a.loja.geId));
let preencheria = 0;
for (const { cnpj, loja } of alvos)
  if (mesclarCadastro(loja.faturamento, faturamentoDaBase(lidas.porCnpj.get(cnpj)!)).novo)
    preencheria++;

const linhas = [
  aplicar ? 'CARGA APLICADA' : 'ENSAIO (nada foi gravado; use --aplicar para gravar)',
  `Arquivo: ${nome} · período ${periodo.inicio} a ${periodo.fim} · vezes por dia (seg…dom): ${lidas.vezes.join('/')}`,
  `Linhas aceitas: ${lidas.aceitas} · rejeitadas: ${lidas.erros.length}`,
  `CNPJs no arquivo: ${cnpjs.length} · com loja cadastrada: ${cnpjs.length - semLoja.length} (${alvos.length} lojas em ${grupos.size} grupos) · sem loja: ${semLoja.length}`,
  `Lojas cadastradas fora do arquivo (mantêm a base que têm): ${todas.length - alvos.length}`,
  `Cadastro que receberia faturamento ou CMV médio (só onde vazio): ${preencheria} lojas`,
  `Avisos: linhas zeradas ${lidas.avisos.linhaZerada} · unidades menores que clientes ${lidas.avisos.unidadesMenoresQueClientes} · CMV maior que a venda ${lidas.avisos.cmvMaiorQueVenda} · lojas com poucos dias ${lidas.avisos.lojaComPoucosDias}`,
  ...lidas.erros.slice(0, 20).map((e) => `  linha ${e.linha}: ${e.motivo}`),
];
process.stdout.write(`${linhas.join('\n')}\n`);

if (aplicar) {
  const inicioTempo = Date.now();
  const falhas: string[] = [];
  let gravadas = 0;
  let preenchidas = 0;
  let jaTinham = 0;
  const fila = [...alvos];
  const trabalhador = async () => {
    for (let a = fila.shift(); a; a = fila.shift()) {
      try {
        const g = await gravarBaseDaLoja(escalaRepository(a.loja.geId), {
          loja: a.loja,
          linhas: lidas.porCnpj.get(a.cnpj)!,
          arquivo: nome,
          rejeitadas: lidas.erros.filter((e) => e.loja === a.cnpj).length,
          periodo,
        });
        gravadas++;
        if (g.preencheuCadastro) preenchidas++;
        if (g.jaTinhaValor) jaTinham++;
        if (gravadas % 200 === 0) process.stdout.write(`  ${gravadas}/${alvos.length} lojas…\n`);
      } catch (e) {
        falhas.push(
          `${a.loja.codigo} (${a.cnpj}): ${e instanceof Error ? e.message.slice(0, 120) : 'erro'}`,
        );
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, trabalhador));
  await prisma.auditoria.create({
    data: {
      acao: 'base-comercial.importada',
      perfil: 'COMANDO',
      alvoTipo: 'carga',
      detalhe: {
        arquivo: nome,
        formato: 'por_cnpj',
        periodo,
        lojas: gravadas,
        cnpjsSemLoja: semLoja.length,
        falhas: falhas.length,
      },
    },
  });
  process.stdout.write(
    [
      `Lojas gravadas: ${gravadas} de ${alvos.length} em ${Math.round((Date.now() - inicioTempo) / 1000)} s · Cadastro preenchido em ${preenchidas} · já tinham valor próprio ${jaTinham}`,
      falhas.length
        ? `NÃO gravadas (${falhas.length}):\n${falhas.map((f) => `  ${f}`).join('\n')}`
        : 'Nenhuma falha.',
    ].join('\n') + '\n',
  );
}
await prisma.$disconnect();
