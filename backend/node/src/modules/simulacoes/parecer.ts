import type { PessoaSim, TurnoSim } from './avaliar.js';
import type { ResultadoSimulacao } from './resultado.js';

// Parecer do cenário (spec 056): o texto corrido, em linguagem simples, com as decisões da simulação e os efeitos dela. É escrito
// uma vez, na hora de salvar, em duas versões: a do dono (com pesos e reais) e a pública (gestor e consulta, sem nenhum valor
// em reais nem percentual de custo, só o sentido). Quem serve o parecer entrega a versão do perfil; a do dono nem sai do
// servidor para os outros.

export type SecaoDoParecer = { titulo: string; itens: string[] };
export type TextoDoParecer = {
  // 2 a 3 frases.
  resumo: string[];
  decisoes: SecaoDoParecer[];
  efeitos: SecaoDoParecer[];
};
export type ParecerGuardado = {
  versao: 1;
  montadoEm: string;
  // O perfil de quem salvou (TENANT_ADMIN, SCHEDULE_MANAGER ou SCHEDULE_VIEWER); a rota o mostra como Dono, Gestor ou Consulta.
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
const NOME_PLURAL: Record<string, string> = {
  Farmacêutico: 'farmacêuticos',
  Atendimento: 'atendentes',
  Caixa: 'caixas',
};
const NOME_SINGULAR: Record<string, string> = { Atendimento: 'atendente' };
const singular = (f: string) => NOME_SINGULAR[f] ?? f.charAt(0).toLowerCase() + f.slice(1);
const plural = (f: string) => NOME_PLURAL[f] ?? `${singular(f)}s`;

const pct1 = (n: number) => `${n.toFixed(1).replace('.', ',')}%`;
const milhar = (n: number) => Math.round(Math.abs(n)).toLocaleString('pt-BR');
const reais = (n: number) => `R$ ${milhar(n)}`;
const reaisComSinal = (n: number) => `${n < 0 ? MENOS : ''}${reais(n)}`;
const horas = (n: number) => `${String(Math.round(n * 10) / 10).replace('.', ',')} h`;
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

// "Horário": o que muda em relação ao Cadastro, dia a dia.
const decisoesDeHorario = (r: ResultadoSimulacao) => {
  const mudancas = r.horario.dias.flatMap((d) => {
    if (!d.alterado) return [];
    const c = r.horario.cadastro[d.dia];
    const nome = NOME_DO_DIA[d.dia]!;
    const hoje = c?.aberta ? `hoje ${hhParaTxt(c.abre)} às ${hhParaTxt(c.fecha)}` : 'hoje fechado';
    return [
      d.aberta
        ? `${nome[0]!.toUpperCase()}${nome.slice(1)}: abre das ${hhParaTxt(d.abre)} às ${hhParaTxt(d.fecha)} (${hoje}).`
        : `${nome[0]!.toUpperCase()}${nome.slice(1)}: fecha (${hoje}).`,
    ];
  });
  return mudancas.length ? mudancas : ['Horário igual ao do Cadastro.'];
};

const decisoesDeFolgas = (r: ResultadoSimulacao, quadro: PessoaSim[], turnos: TurnoSim[]) => {
  const abertos = r.horario.dias.filter((d) => d.aberta).map((d) => d.dia);
  const porFuncao = new Map<string, number[]>();
  for (const p of quadro) {
    if (p.vaga || p.desligado || !p.funcao) continue;
    const trabalhados = new Set(
      turnos
        .filter((t) => t.matricula === p.matricula && abertos.includes(t.dia))
        .map((t) => t.dia),
    );
    if (trabalhados.size === 0) continue;
    porFuncao.set(p.funcao, [...(porFuncao.get(p.funcao) ?? []), trabalhados.size]);
  }
  const frases = [...porFuncao].map(([f, dias]) => {
    const min = Math.min(...dias);
    const max = Math.max(...dias);
    const trab = min === max ? `${min} dias` : `de ${min} a ${max} dias`;
    const folga =
      min === max ? abertos.length - min : `${abertos.length - max} a ${abertos.length - min}`;
    return `${plural(f)} trabalham ${trab} por semana (folgam ${folga})`;
  });
  return frases.length
    ? [`Folgas: ${lista(frases)}.`]
    : ['Folgas: a escala da simulação não traz turnos por pessoa.'];
};

const rotuloDaContratacao = (r: ResultadoSimulacao, quadro: PessoaSim[]) =>
  r.funcoes.flatMap((f) =>
    f.contratacoes.map((c) => {
      const v = quadro.find((p) => p.matricula === c.matricula);
      const funcao = v?.funcao ?? f.funcao;
      const nome = singular(funcao);
      // Só o farmacêutico é obrigatório; as demais contratações são desejáveis (mantêm o nível de hoje).
      const desejavel = funcao !== 'Farmacêutico' ? ' · desejável' : '';
      return `1 ${nome}, ${horas(c.cargaH)} por semana (${c.tipo === 'integral' ? 'jornada cheia' : 'parcial'}${desejavel}).`;
    }),
  );

export const montarParecer = (e: EntradaParecer): ParecerGuardado => {
  const { quadro, turnos, resultado: r } = e;
  const h = r.emHoras;
  const c = r.custoDoDono;
  const contratacoes = rotuloDaContratacao(r, quadro);
  const desligados = quadro.filter((p) => p.desligado && !p.vaga);
  const horasQueFaltam = r.funcoes.filter((f) => !f.resultado.coberto);
  const faltaTotal = horasQueFaltam.reduce((s, f) => s + f.resultado.horas, 0);
  const abreMais = r.horarioEstendido ? quandoAbreMais(r) : null;

  // ---- Decisões (iguais nas duas versões: não têm valores em reais) ----
  const decisoes: SecaoDoParecer[] = [
    {
      titulo: 'Contratações',
      itens: contratacoes.length ? contratacoes : ['Nenhuma contratação.'],
    },
    {
      titulo: 'Desligamentos',
      itens: desligados.length
        ? desligados.map((p) => `${p.nome} (${singular(p.funcao ?? '')}).`)
        : ['Nenhum desligamento.'],
    },
    { titulo: 'Horário', itens: decisoesDeHorario(r) },
    { titulo: 'Folgas', itens: decisoesDeFolgas(r, quadro, turnos) },
  ];

  // ---- Cobertura, venda e equipe (iguais nas duas versões) ----
  const cobertura: string[] = [];
  if (h.status === 'inviavel')
    cobertura.push('Sem farmacêutico no quadro: a loja não pode funcionar assim (inviável).');
  else if (!horasQueFaltam.length && r.funcoes.every((f) => f.faltaHoje <= 0))
    cobertura.push('A equipe cobre todos os horários.');
  for (const f of r.funcoes) {
    if (f.faltaHoje <= 0 && f.resultado.coberto) continue;
    cobertura.push(
      `${f.funcao}: hoje ${f.faltaHoje > 0 ? `faltam ${horas(f.faltaHoje)} por semana` : 'não falta nenhuma hora'}; neste cenário ${
        f.resultado.coberto ? 'não falta nenhuma hora' : `ainda faltam ${horas(f.resultado.horas)}`
      }.`,
    );
  }
  if (h.status === 'equipe_menor') cobertura.push('A equipe fica menor que a de hoje.');
  if (h.status === 'perde_venda') cobertura.push('O cenário perde venda por fechar horários.');
  if (h.status === 'vende_mais') cobertura.push('O cenário vende mais com as horas novas.');

  const venda =
    h.vendaEstado === 'nao_estimada'
      ? 'A venda não foi estimada (a loja não tem venda por hora).'
      : h.vendaPct == null
        ? 'A venda não pôde ser calculada.'
        : Math.abs(h.vendaPct) < 0.05
          ? 'Sem mudança na venda.'
          : `A venda estimada ${h.vendaPct > 0 ? 'sobe' : 'cai'} ${pct1(Math.abs(h.vendaPct))} em relação a hoje.`;

  const equipe = [
    `Pessoas: de ${h.pessoas.hoje} para ${h.pessoas.simulacao}.`,
    `Horas contratadas por semana: de ${horas(h.horasContratadas.hoje)} para ${horas(h.horasContratadas.simulacao)}.`,
    ...(h.horaExtraH > 0.005 ? [`Hora extra: ${horas(h.horaExtraH)} por semana.`] : []),
  ];

  // ---- Custo: o que muda entre as versões ----
  const sentido = h.custoSentido;
  const fraseSentido =
    sentido === 'aumenta'
      ? 'A folha de pessoal aumenta em relação a hoje.'
      : sentido === 'diminui'
        ? 'A folha de pessoal diminui em relação a hoje.'
        : sentido === 'igual'
          ? 'A folha de pessoal não muda em relação a hoje.'
          : 'Dados do custo ainda não informados.';

  const custoDono: string[] = [];
  let fraseDoDono = fraseSentido;
  if (c) {
    if (c.estado === 'sem_salarios') {
      custoDono.push('Informe os salários para ver o custo de pessoal.');
      fraseDoDono = 'Informe os salários para ver o custo de pessoal.';
    } else {
      if (c.folhaHoje != null && c.folhaDepois != null)
        custoDono.push(`Folha por mês: de ${reais(c.folhaHoje)} para ${reais(c.folhaDepois)}.`);
      if (c.estado === 'sem_faturamento' || !c.peso) {
        custoDono.push('Informe o faturamento para ver o peso da folha.');
      } else {
        const p = c.peso;
        const de = `de ${pct1(p.hoje)} para ${pct1(p.depois)} do faturamento`;
        if (sentido === 'aumenta')
          fraseDoDono = `A folha sobe ${de} (${reais(p.aumentoMensal)} por mês).`;
        else if (sentido === 'diminui')
          fraseDoDono = `A folha cai ${de} (${reais(p.aumentoMensal)} por mês).`;
        else
          fraseDoDono =
            p.depois > p.hoje
              ? `A folha não muda em reais; o peso vai ${de} só porque a venda cai.`
              : 'A folha não muda em reais.';
        custoDono.push(fraseDoDono);
      }
    }
  }
  const x = r.horarioEstendido;
  const horarioAMais: string[] = [];
  if (x) {
    if (x.estado === 'ok' && x.resultadoMensal != null) {
      horarioAMais.push(
        `Horário a mais${abreMais ? ` (${abreMais})` : ''}: venda adicional ${reais(x.vendaAdicionalMensal ?? 0)}, custo da mercadoria ${reais(x.cmvMensal ?? 0)}${x.cmvPct != null ? ` (${pct1(x.cmvPct)})` : ''}, lucro bruto ${reaisComSinal(x.lucroBrutoMensal ?? 0)}, aumento de folha ${reais(x.aumentoFolhaMensal ?? 0)}. Resultado: ${reaisComSinal(x.resultadoMensal)} por mês. ${x.recomendado ? 'Recomendado.' : 'Não recomendado.'}`,
      );
    } else {
      horarioAMais.push(
        `Horário a mais${abreMais ? ` (${abreMais})` : ''}: ${
          x.estado === 'sem_cmv'
            ? 'informe o custo da mercadoria da loja para calcular o lucro bruto.'
            : x.estado === 'sem_salarios'
              ? 'informe os salários para calcular o aumento de folha.'
              : 'envie a base comercial para estimar a venda das horas novas.'
        }`,
      );
    }
  }

  // ---- Resumo ----
  const decidiu: string[] = [];
  if (contratacoes.length)
    decidiu.push(
      `contrata ${lista(
        contratacoes.map((t) => {
          const base = t.replace(/\.$/, '').replace(/ \(.*\)$/, '');
          return t.includes('desejável') ? `${base} (desejável)` : base;
        }),
      )}`,
    );
  else decidiu.push('não contrata ninguém');
  if (desligados.length)
    decidiu.push(`desliga ${desligados.length} ${desligados.length === 1 ? 'pessoa' : 'pessoas'}`);
  if (r.horario.mudou) decidiu.push('muda o horário da loja');
  const frase1 = `Este cenário ${lista(decidiu)}.`;
  const frase2 =
    h.status === 'inviavel'
      ? 'A loja fica sem farmacêutico, o que a torna inviável.'
      : faltaTotal > 0.005
        ? `Mesmo assim, ainda faltam ${horas(faltaTotal)} de cobertura por semana.`
        : 'Com isso o horário fica coberto, sem falta de equipe.';

  const resumoPublico = [frase1, frase2, fraseSentido];
  const resumoDono = [frase1, frase2, fraseDoDono];

  const secaoCusto = (itens: string[]): SecaoDoParecer => ({ titulo: 'Custo', itens });
  const efeitosBase = (custo: SecaoDoParecer): SecaoDoParecer[] => [
    {
      titulo: 'Cobertura',
      itens: cobertura.length ? cobertura : ['A equipe cobre todos os horários.'],
    },
    { titulo: 'Venda', itens: [venda] },
    { titulo: 'Equipe', itens: equipe },
    custo,
  ];

  return {
    versao: 1,
    montadoEm: new Date().toISOString(),
    dono: {
      resumo: resumoDono,
      decisoes,
      efeitos: efeitosBase(
        secaoCusto([...custoDono, ...(custoDono.length ? [] : [fraseSentido]), ...horarioAMais]),
      ),
    },
    publico: {
      resumo: resumoPublico,
      decisoes,
      efeitos: efeitosBase(secaoCusto([fraseSentido])),
    },
  };
};
