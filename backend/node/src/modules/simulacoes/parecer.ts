import type { PessoaSim, TurnoSim } from './avaliar.js';
import type { ResultadoSimulacao } from './resultado.js';

// Parecer do cenário (specs 056 e 057): um parágrafo corrido, três números grandes e a tabela "O que muda", em linguagem simples.
// É montado uma vez, na hora de salvar, em duas versões: a do dono (com pesos e reais) e a pública (gestor e consulta, sem nenhum
// valor em reais nem percentual de custo, só o sentido). Quem serve o parecer entrega a versão do perfil; a do dono nem sai do
// servidor para os outros. A tela e o PDF só desenham o que vem pronto, então os dois mostram sempre o mesmo conteúdo.

// Tom do chip: nunca vai sozinho, o texto sempre traz o sinal (+, −) ou a palavra.
export type Tom = 'verde' | 'ambar' | 'vermelho' | 'neutro';
export type Chip = { texto: string; tom: Tom };

export type CartaoDoParecer = {
  titulo: string;
  valor: string;
  chip: Chip | null;
  apoio: string | null;
};
export type LinhaDaTabela = {
  rotulo: string;
  hoje: string;
  comOCenario: string;
  mudanca: { texto: string; tom: Tom };
};
export type TextoDoParecer = {
  status: Chip;
  paragrafo: string;
  cartoes: { folha: CartaoDoParecer; equipe: CartaoDoParecer; farmaceutico: CartaoDoParecer };
  tabela: LinhaDaTabela[];
  // Só o dono: o resultado do horário a mais (venda adicional, custo da mercadoria, lucro bruto, folha, resultado).
  horarioAMais: string[] | null;
};
export type ParecerGuardado = {
  versao: 2;
  montadoEm: string;
  // O perfil de quem salvou (TENANT_ADMIN, SCHEDULE_MANAGER ou SCHEDULE_VIEWER); a rota o mostra como dono, gestor ou consulta.
  salvoPor?: string;
  dono: TextoDoParecer;
  publico: TextoDoParecer;
};

export type EntradaParecer = {
  quadro: PessoaSim[];
  turnos: TurnoSim[];
  // Sempre o resultado COMPLETO (calculado como dono); a versão pública é derivada dele sem números de custo.
  resultado: ResultadoSimulacao;
};

const MENOS = '−';
const NOME_DO_DIA = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
const NOME_SINGULAR: Record<string, string> = { Atendimento: 'atendente' };
const singular = (f: string) => NOME_SINGULAR[f] ?? f.charAt(0).toLowerCase() + f.slice(1);

const num1 = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const pct1 = (n: number) => `${n.toFixed(1).replace('.', ',')}%`;
const milhar = (n: number) => Math.round(Math.abs(n)).toLocaleString('pt-BR');
const reais = (n: number) => `R$ ${milhar(n)}`;
const reaisComSinal = (n: number) => `${n < 0 ? MENOS : ''}${reais(n)}`;
// "16 h" (com espaço, nos números grandes) e "42h" (colado, nas cargas e na tabela).
const horasEsp = (n: number) => `${num1(n)} h`;
const horasCol = (n: number) => `${num1(n)}h`;
const sinal = (n: number, f: (v: number) => string) => `${n > 0 ? '+' : MENOS}${f(Math.abs(n))}`;
const hhParaTxt = (t: string | null) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t ?? '');
  if (!m) return '';
  return m[2] === '00' ? `${m[1]!.padStart(2, '0')}h` : `${m[1]!.padStart(2, '0')}h${m[2]}`;
};
const minutos = (t: string | null) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const lista = (itens: string[]) =>
  itens.length > 1
    ? `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
    : (itens[0] ?? '');

// Os dias em que a simulação abre horas a mais que o Cadastro: "sábado até 23h".
const quandoAbreMais = (r: ResultadoSimulacao) => {
  const partes = r.horario.dias.flatMap((d) => {
    if (!d.aberta) return [];
    const c = r.horario.cadastro[d.dia];
    const nome = NOME_DO_DIA[d.dia]!;
    if (!c?.aberta) return [{ nome, quando: `das ${hhParaTxt(d.abre)} às ${hhParaTxt(d.fecha)}` }];
    const fechaMais = (minutos(d.fecha) ?? 0) > (minutos(c.fecha) ?? 0);
    const abreMais = (minutos(d.abre) ?? 0) < (minutos(c.abre) ?? 0);
    if (fechaMais && abreMais)
      return [{ nome, quando: `das ${hhParaTxt(d.abre)} às ${hhParaTxt(d.fecha)}` }];
    if (fechaMais) return [{ nome, quando: `até ${hhParaTxt(d.fecha)}` }];
    if (abreMais) return [{ nome, quando: `a partir das ${hhParaTxt(d.abre)}` }];
    return [];
  });
  if (!partes.length) return null;
  const quandos = new Set(partes.map((p) => p.quando));
  if (quandos.size === 1) return `${lista(partes.map((p) => p.nome))} ${partes[0]!.quando}`;
  return partes.map((p) => `${p.nome} ${p.quando}`).join(', ');
};

// "o horário continua igual ao do Cadastro" ou a mudança, dia a dia.
const frasesDoHorario = (r: ResultadoSimulacao) => {
  const mudancas = r.horario.dias.flatMap((d) => {
    if (!d.alterado) return [];
    const nome = NOME_DO_DIA[d.dia]!;
    return [
      d.aberta ? `${nome} das ${hhParaTxt(d.abre)} às ${hhParaTxt(d.fecha)}` : `${nome} fechada`,
    ];
  });
  return mudancas.length
    ? `o horário muda (${mudancas.join('; ')})`
    : 'o horário continua igual ao do Cadastro';
};

// "e todos trabalham 5 dias por semana e folgam 2" (ou, quando varia, o intervalo). Contam quem está na simulação, inclusive as vagas.
const frasesDeFolgas = (r: ResultadoSimulacao, quadro: PessoaSim[], turnos: TurnoSim[]) => {
  const abertos = r.horario.dias.filter((d) => d.aberta).map((d) => d.dia);
  const dias: number[] = [];
  for (const p of quadro) {
    if (p.desligado || (!p.vaga && !p.funcao)) continue;
    const trab = new Set(
      turnos
        .filter((t) => t.matricula === p.matricula && abertos.includes(t.dia))
        .map((t) => t.dia),
    ).size;
    if (trab > 0) dias.push(trab);
  }
  if (!dias.length) return 'e as folgas giram na escala';
  const min = Math.min(...dias);
  const max = Math.max(...dias);
  const diasTxt = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`;
  if (min !== max) return `e cada pessoa trabalha de ${min} a ${diasTxt(max)} por semana`;
  const folgas = abertos.length - min;
  return folgas <= 0
    ? 'e todos trabalham todos os dias em que a loja abre'
    : `e todos trabalham ${diasTxt(min)} por semana e folgam ${folgas}`;
};

type Contratacao = { funcao: string; cargaH: number; desejavel: boolean };
const contratacoesDe = (r: ResultadoSimulacao, quadro: PessoaSim[]): Contratacao[] =>
  r.funcoes.flatMap((f) =>
    f.contratacoes.map((c) => {
      const funcao = quadro.find((p) => p.matricula === c.matricula)?.funcao ?? f.funcao;
      // Só o farmacêutico é obrigatório; as demais contratações são desejáveis (mantêm o nível de hoje).
      return { funcao, cargaH: c.cargaH, desejavel: funcao !== 'Farmacêutico' };
    }),
  );

const frasesDeContratacao = (cs: Contratacao[]) => {
  if (!cs.length) return 'Sem contratar ninguém,';
  const mesma = cs.every((c) => c.cargaH === cs[0]!.cargaH);
  const nomes = cs.map(
    (c) =>
      `1 ${singular(c.funcao)}${c.desejavel ? ' (desejável)' : ''}${mesma ? '' : `, ${horasCol(c.cargaH)} por semana`}`,
  );
  return `Contratando ${lista(nomes)}${mesma ? `, ${horasCol(cs[0]!.cargaH)} por semana ${cs.length > 1 ? 'cada' : ''}`.trimEnd() : ''},`;
};

export const montarParecer = (e: EntradaParecer): ParecerGuardado => {
  const { quadro, turnos, resultado: r } = e;
  const h = r.emHoras;
  const c = r.custoDoDono;
  const contratacoes = contratacoesDe(r, quadro);
  const desligados = quadro.filter((p) => p.desligado && !p.vaga);
  const farm = r.funcoes.find((f) => f.funcao === 'Farmacêutico');
  const farmHoje = farm?.faltaHoje ?? 0;
  const farmDepois = farm && !farm.resultado.coberto ? farm.resultado.horas : 0;
  const faltaTotal = r.funcoes
    .filter((f) => !f.resultado.coberto)
    .reduce((s, f) => s + f.resultado.horas, 0);
  const sentido = h.custoSentido;
  const x = r.horarioEstendido;
  const abreMais = x ? quandoAbreMais(r) : null;

  // ---- Chip de status ----
  const status = ((): Chip => {
    if (x && x.estado === 'ok' && x.resultadoMensal != null && !x.recomendado)
      return { texto: 'Não recomendado', tom: 'vermelho' };
    if (h.status === 'inviavel') return { texto: 'Inviável', tom: 'vermelho' };
    if (h.status === 'perde_venda') return { texto: 'Perde venda', tom: 'ambar' };
    if (h.status === 'equipe_menor') return { texto: 'Equipe menor que hoje', tom: 'ambar' };
    if (h.status === 'vende_mais') return { texto: 'Vende mais', tom: 'verde' };
    return { texto: 'Cobre o horário', tom: 'verde' };
  })();

  // ---- Parágrafo: o que foi decidido e o que isso faz, em frases que se encaixam ----
  const abertura = frasesDeContratacao(contratacoes);
  const cobertura =
    h.status === 'inviavel'
      ? 'a loja fica sem farmacêutico e não pode funcionar assim.'
      : faltaTotal > 0.005
        ? `ainda faltam ${horasCol(faltaTotal)} de cobertura por semana.`
        : contratacoes.length
          ? 'a loja passa a cobrir todo o horário de funcionamento.'
          : 'a loja segue cobrindo todo o horário de funcionamento.';
  const desliga = desligados.length
    ? `Desligando ${desligados.length === 1 ? `1 ${singular(desligados[0]!.funcao ?? '')}` : `${desligados.length} pessoas`},`
    : 'Ninguém é desligado,';
  const venda =
    h.vendaEstado === 'nao_estimada'
      ? 'A venda não foi estimada'
      : h.vendaPct == null
        ? 'A venda não pôde ser calculada'
        : Math.abs(h.vendaPct) < 0.05
          ? 'A venda não muda'
          : `A venda ${h.vendaPct > 0 ? 'sobe' : 'cai'} ${pct1(Math.abs(h.vendaPct))}`;
  const custoDono =
    c && c.estado !== 'ok'
      ? ' e ainda faltam dados para ver o custo de pessoal.'
      : sentido === 'aumenta'
        ? ', mas a folha pesa mais no faturamento.'
        : sentido === 'diminui'
          ? ' e a folha pesa menos no faturamento.'
          : sentido === 'igual'
            ? ' e a folha fica igual.'
            : ' e ainda faltam dados para ver o custo de pessoal.';
  const custoPublico =
    sentido === 'aumenta'
      ? ', mas o custo de pessoal aumenta.'
      : sentido === 'diminui'
        ? ' e o custo de pessoal diminui.'
        : sentido === 'igual'
          ? ' e o custo de pessoal fica igual.'
          : ' e os dados do custo ainda não foram informados.';
  const miolo = `${abertura} ${cobertura} ${desliga} ${frasesDoHorario(r)} ${frasesDeFolgas(r, quadro, turnos)}.`;
  const paragrafo = (custo: string) => `${miolo} ${venda}${custo}`;

  // ---- Os três números grandes ----
  const dPessoas = h.pessoas.simulacao - h.pessoas.hoje;
  const equipe: CartaoDoParecer = {
    titulo: 'Equipe',
    valor: `${h.pessoas.simulacao} ${h.pessoas.simulacao === 1 ? 'pessoa' : 'pessoas'}`,
    chip: {
      texto: dPessoas === 0 ? 'igual' : sinal(dPessoas, String),
      tom: dPessoas > 0 ? 'verde' : 'neutro',
    },
    apoio: `hoje ${h.pessoas.hoje}`,
  };
  const farmaceutico: CartaoDoParecer = {
    titulo: 'Farmacêutico faltando',
    valor: horasEsp(farmDepois),
    chip:
      farmDepois <= 0.005 ? { texto: 'coberto', tom: 'verde' } : { texto: 'faltam', tom: 'ambar' },
    apoio:
      farmHoje > 0.005
        ? `hoje faltam ${horasEsp(farmHoje)} por semana`
        : 'hoje não falta nenhuma hora',
  };
  const folhaDono = ((): CartaoDoParecer => {
    const titulo = 'Folha no faturamento';
    if (!c || c.estado === 'sem_salarios')
      return {
        titulo,
        valor: '—',
        chip: null,
        apoio: 'Informe os salários para ver o custo de pessoal.',
      };
    if (c.estado === 'sem_faturamento' || !c.peso || c.folhaHoje == null || c.folhaDepois == null)
      return {
        titulo,
        valor: '—',
        chip: null,
        apoio: 'Informe o faturamento para ver o peso da folha.',
      };
    const dif = c.folhaDepois - c.folhaHoje;
    const hoje = `hoje ${pct1(c.peso.hoje)}`;
    if (sentido === 'aumenta')
      return {
        titulo,
        valor: pct1(c.peso.depois),
        chip: { texto: `+${pct1(Math.abs(c.peso.aumentoPp))}`, tom: 'ambar' },
        apoio: `${hoje} · ${reais(dif)} a mais por mês`,
      };
    if (sentido === 'diminui')
      return {
        titulo,
        valor: pct1(c.peso.depois),
        chip: { texto: `${MENOS}${pct1(Math.abs(c.peso.aumentoPp))}`, tom: 'verde' },
        apoio: `${hoje} · ${reais(dif)} a menos por mês`,
      };
    return {
      titulo,
      valor: pct1(c.peso.depois),
      chip: { texto: 'folha igual', tom: 'neutro' },
      apoio: c.peso.depois > c.peso.hoje ? `${hoje} · Sobe só porque a venda cai.` : hoje,
    };
  })();
  const folhaPublica: CartaoDoParecer = {
    titulo: 'Custo de pessoal',
    valor: '—',
    chip: sentido
      ? {
          texto: sentido === 'aumenta' ? 'Aumenta' : sentido === 'diminui' ? 'Diminui' : 'Igual',
          tom: sentido === 'aumenta' ? 'ambar' : sentido === 'diminui' ? 'verde' : 'neutro',
        }
      : null,
    apoio: sentido ? 'sem valores em reais' : 'Dados do custo ainda não informados.',
  };

  // ---- A tabela "O que muda" ----
  const linhaDe = (
    rotulo: string,
    hoje: string,
    depois: string,
    mudanca: { texto: string; tom: Tom },
  ): LinhaDaTabela => ({ rotulo, hoje, comOCenario: depois, mudanca });
  const dFalta = farmDepois - farmHoje;
  const dHoras = h.horasContratadas.simulacao - h.horasContratadas.hoje;
  const tabelaBase: LinhaDaTabela[] = [
    linhaDe(
      'Farmacêutico faltando',
      `${horasEsp(farmHoje)} por semana`,
      horasEsp(farmDepois),
      Math.abs(dFalta) < 0.005
        ? { texto: '—', tom: 'neutro' }
        : { texto: sinal(dFalta, horasEsp), tom: dFalta < 0 ? 'verde' : 'ambar' },
    ),
    linhaDe(
      'Venda',
      '—',
      h.vendaPct == null || Math.abs(h.vendaPct) < 0.05
        ? 'sem mudança'
        : `${h.vendaPct > 0 ? '+' : MENOS}${pct1(Math.abs(h.vendaPct))}`,
      h.vendaPct == null || Math.abs(h.vendaPct) < 0.05
        ? { texto: '—', tom: 'neutro' }
        : {
            texto: `${h.vendaPct > 0 ? '+' : MENOS}${pct1(Math.abs(h.vendaPct))}`,
            tom: h.vendaPct > 0 ? 'verde' : 'ambar',
          },
    ),
    linhaDe(
      'Pessoas',
      String(h.pessoas.hoje),
      String(h.pessoas.simulacao),
      dPessoas === 0
        ? { texto: '—', tom: 'neutro' }
        : { texto: sinal(dPessoas, String), tom: dPessoas > 0 ? 'verde' : 'neutro' },
    ),
    linhaDe(
      'Horas contratadas por semana',
      horasCol(h.horasContratadas.hoje),
      horasCol(h.horasContratadas.simulacao),
      Math.abs(dHoras) < 0.005
        ? { texto: '—', tom: 'neutro' }
        : { texto: sinal(dHoras, horasCol), tom: dHoras > 0 ? 'verde' : 'neutro' },
    ),
  ];
  const linhaFolha: LinhaDaTabela[] =
    c && c.folhaHoje != null && c.folhaDepois != null
      ? [
          linhaDe(
            'Folha por mês',
            reais(c.folhaHoje),
            reais(c.folhaDepois),
            c.folhaDepois === c.folhaHoje
              ? { texto: 'igual', tom: 'neutro' }
              : {
                  texto: `${c.folhaDepois > c.folhaHoje ? '+' : MENOS}${reais(c.folhaDepois - c.folhaHoje)}`,
                  tom: c.folhaDepois > c.folhaHoje ? 'ambar' : 'verde',
                },
          ),
        ]
      : [];

  // ---- O horário a mais (só dono) ----
  const horarioAMais: string[] | null = x
    ? [
        x.estado === 'ok' && x.resultadoMensal != null
          ? `Horário a mais${abreMais ? ` (${abreMais})` : ''}: venda adicional ${reais(x.vendaAdicionalMensal ?? 0)}, custo da mercadoria ${reais(x.cmvMensal ?? 0)}${x.cmvPct != null ? ` (${pct1(x.cmvPct)})` : ''}, lucro bruto ${reaisComSinal(x.lucroBrutoMensal ?? 0)}, aumento de folha ${reais(x.aumentoFolhaMensal ?? 0)}. Resultado: ${reaisComSinal(x.resultadoMensal)} por mês. ${x.recomendado ? 'Recomendado.' : 'Não recomendado.'}`
          : `Horário a mais${abreMais ? ` (${abreMais})` : ''}: ${
              x.estado === 'sem_cmv'
                ? 'informe o custo da mercadoria da loja para calcular o lucro bruto.'
                : x.estado === 'sem_salarios'
                  ? 'informe os salários para calcular o aumento de folha.'
                  : 'envie a base comercial para estimar a venda das horas novas.'
            }`,
      ]
    : null;

  return {
    versao: 2,
    montadoEm: new Date().toISOString(),
    dono: {
      status,
      paragrafo: paragrafo(custoDono),
      cartoes: { folha: folhaDono, equipe, farmaceutico },
      tabela: [...tabelaBase, ...linhaFolha],
      horarioAMais,
    },
    publico: {
      status,
      paragrafo: paragrafo(custoPublico),
      cartoes: { folha: folhaPublica, equipe, farmaceutico },
      tabela: tabelaBase,
      horarioAMais: null,
    },
  };
};
