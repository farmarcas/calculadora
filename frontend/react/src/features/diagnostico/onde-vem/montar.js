// Montador da seção "De onde vêm esses números" (sem React): recebe o Diagnóstico que o servidor já calculou e devolve
// o que cada aba desenha. Nenhuma regra de negócio nova: só recorta, ordena e escreve em texto.

const EPS = 1e-9;
const arred = (n) => Math.round(n * 100) / 100;
export const ORDEM_FUNCOES = ["Farmacêutico", "Atendimento", "Caixa", "Apoio", "Perfumaria"];
export const LIMITE_PICO = 0.75;

export const horaDeTexto = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  return h + (m || 0) / 60;
};
export const textoDeHora = (h) => `${String(Math.floor(h + EPS)).padStart(2, "0")}:${String(Math.round((h % 1) * 60) % 60).padStart(2, "0")}`;
export const hh = (h) => `${String(h).padStart(2, "0")}h`;
const minuscula = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// Cada turno vira um ou dois pedaços do relógio (o que vira a noite é cortado na meia-noite); fim 00:00 = meia-noite.
export const pedacosDeTurno = (t) => {
  const i = horaDeTexto(t.inicio);
  let f = horaDeTexto(t.fim);
  if (f < EPS) f = 24;
  if (f > i + EPS) return [{ de: i, ate: f }];
  return [{ de: i, ate: 24 }, ...(f > EPS && f < i ? [{ de: 0, ate: f }] : [])];
};

// Horário de funcionamento: do primeiro horário aberto ao último (24h = 00:00 a 24:00). Nulo sem horário.
export const janelaDaLoja = (horarios) => {
  const abertos = (horarios?.dias ?? []).filter((d) => d.aberta);
  if (!abertos.length) return null;
  const abre = Math.min(...abertos.map((d) => (d.h24 ? 0 : horaDeTexto(d.abre))));
  const fecha = Math.max(...abertos.map((d) => (d.h24 ? 24 : horaDeTexto(d.fecha === "00:00" ? "24:00" : d.fecha))));
  return { abre, fecha, texto: `${textoDeHora(abre)} às ${textoDeHora(fecha)}` };
};

// Hora de pico: venda de pelo menos 75% do maior valor do período (suposição do pedido; única função).
export const isHoraPico = (valor, maximo) => maximo > 0 && valor >= maximo * LIMITE_PICO - EPS;

// Sequência de horas seguidas que contém `hora` (de `horas`, ordenadas).
const blocoQueContem = (horas, hora) => {
  const s = new Set(horas);
  if (!s.has(hora)) return [];
  let a = hora;
  let b = hora;
  while (s.has(a - 1)) a--;
  while (s.has(b + 1)) b++;
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
};

// Vendas por hora no formato da grade. Quem não é dono recebe só a participação (%), não o valor em reais.
const vendasDaGrade = (vendas, dentro) => {
  if (!vendas?.horas?.length) return null;
  const emReais = vendas.horas.some((h) => h.vendaMedia != null);
  const valorDe = (h) => (emReais ? h.vendaMedia : h.participacao) ?? 0;
  const max = Math.max(0, ...vendas.horas.map(valorDe));
  const lista = vendas.horas
    .filter((h) => valorDe(h) > 0)
    .map((h) => ({ hora: h.hora, valor: valorDe(h), participacao: h.participacao ?? 0, pico: isHoraPico(valorDe(h), max), foraDoHorario: !dentro.has(h.hora) }));
  return { emReais, max, horas: lista };
};

// Texto do pico: só existe quando o maior número de atendentes aparece FORA do pico e é maior que o do pico.
export const buildObservacaoPico = ({ vendas, atendimento }) => {
  if (!vendas || !atendimento) return null;
  const pessoasPorHora = new Map(atendimento.celulas.filter((c) => c.pessoas != null).map((c) => [c.hora, c.pessoas]));
  const picos = vendas.horas.filter((h) => h.pico && pessoasPorHora.has(h.hora));
  if (!picos.length) return null;
  const maisVendida = picos.reduce((a, b) => (b.valor > a.valor ? b : a));
  const blocoPico = blocoQueContem(picos.map((h) => h.hora), maisVendida.hora);
  const noPico = Math.max(...blocoPico.map((h) => pessoasPorHora.get(h)));
  const horasPico = new Set(vendas.horas.filter((h) => h.pico).map((h) => h.hora));
  const fora = [...pessoasPorHora].filter(([h]) => !horasPico.has(h));
  if (!fora.length) return null;
  const maxFora = Math.max(...fora.map(([, p]) => p));
  if (!(maxFora > noPico)) return null;
  const horasMax = fora.filter(([, p]) => p === maxFora).map(([h]) => h).sort((a, b) => a - b);
  const bloco = blocoQueContem(horasMax, horasMax[0]);
  const r = { horaIni: Math.min(...blocoPico), horaFim: Math.max(...blocoPico), pessoasNoPico: noPico, pessoasFora: maxFora, h1: Math.min(...bloco), h2: Math.max(...bloco) };
  return {
    ...r,
    texto: `No pico de vendas, das ${hh(r.horaIni)} às ${hh(r.horaFim)}, há ${noPico} ${noPico === 1 ? "atendente" : "atendentes"}. As ${maxFora} pessoas só aparecem entre ${hh(r.h1)} e ${hh(r.h2)}, quando as vendas já são menores. Dá para testar outros horários em Personalizar.`,
  };
};

// Turnos da loja na grade: cada um recortado ao horário da loja (colunas de hora inteira); todos visíveis, mesmo sobrepostos
// (os que não se cruzam dividem a mesma linha). Sem turnos (ou no modo "mínimo único") devolve nulo.
export const turnosDaGrade = (config, dentro) => {
  const usa = config?.modoMinimo !== "unico" && config?.turnos?.length;
  if (!usa) return null;
  const valido = config.turnos.filter((t) => horaDeTexto(t.inicio) !== horaDeTexto(t.fim));
  const itens = valido.map((t, i) => {
    const faixas = [];
    for (const p of pedacosDeTurno(t)) {
      const horas = [...dentro].filter((h) => p.de <= h + 0.5 && h + 0.5 < p.ate).sort((a, b) => a - b);
      for (const h of horas) {
        const ult = faixas[faixas.length - 1];
        if (ult && ult.ate === h) ult.ate = h + 1;
        else faixas.push({ de: h, ate: h + 1 });
      }
    }
    return { indice: i, nome: t.nome, inicio: t.inicio, fim: t.fim, rotulo: `Turno ${t.nome} · ${t.inicio}–${t.fim}`, faixas, de: horaDeTexto(t.inicio), ate: horaDeTexto(t.fim) || 24 };
  });
  const lanes = [];
  for (const t of [...itens].sort((a, b) => a.de - b.de)) {
    const faixa = t.faixas.length ? [t.faixas[0].de, t.faixas[t.faixas.length - 1].ate] : null;
    const lane = lanes.find((l) => !faixa || l.every((o) => !o.faixas.length || o.faixas[o.faixas.length - 1].ate <= faixa[0] || o.faixas[0].de >= faixa[1]));
    if (lane) lane.push(t);
    else lanes.push([t]);
  }
  return { lanes, sobrepoe: lanes.length > 1 };
};

const rotuloMinimo = (minimoMax) => (minimoMax > 0 ? `mínimo ${minimoMax} ${minimoMax === 1 ? "pessoa" : "pessoas"}` : "sem mínimo por hora");

// Aba 1: tudo o que a grade desenha.
export const montarCobertura = (diag) => {
  const cob = diag.cobertura;
  const dentro = new Set(cob?.horas ?? []);
  if (!dentro.size) return null;
  const vendas = vendasDaGrade(diag.vendas, dentro);
  const horasEixo = [...dentro, ...(vendas?.horas.map((h) => h.hora) ?? [])];
  const ini = Math.min(...horasEixo);
  const fim = Math.max(...horasEixo);
  const eixo = Array.from({ length: fim - ini + 1 }, (_, i) => ini + i);
  const funcoes = (cob.funcoes ?? [])
    .map((f) => {
      const porHora = new Map(f.porHora.map((c) => [c.hora, c]));
      const celulas = eixo.map((hora) => {
        const c = porHora.get(hora);
        if (!c || c.pessoas == null || !dentro.has(hora)) return { hora, pessoas: null, exigido: 0, estado: "fora" };
        return { hora, pessoas: c.pessoas, exigido: c.exigido ?? 0, estado: c.ok === false ? "abaixo" : "atende" };
      });
      const maxExigido = Math.max(0, ...celulas.map((c) => c.exigido));
      return { funcao: f.funcao, rotuloMinimo: rotuloMinimo(maxExigido), celulas };
    })
    .sort((a, b) => ORDEM_FUNCOES.indexOf(a.funcao) - ORDEM_FUNCOES.indexOf(b.funcao));
  const janela = janelaDaLoja(diag.loja?.horarios);
  const foraHoras = vendas ? vendas.horas.filter((h) => h.foraDoHorario).map((h) => h.hora) : [];
  const atendimento = funcoes.find((f) => f.funcao === "Atendimento");
  return {
    eixo,
    dentro,
    janelaTexto: janela?.texto ?? null,
    vendas: vendas ? { ...vendas, horas: eixo.map((h) => vendas.horas.find((v) => v.hora === h) ?? { hora: h, valor: 0, pico: false, foraDoHorario: !dentro.has(h) }) } : null,
    turnos: turnosDaGrade(diag.config, dentro),
    funcoes,
    observacao: buildObservacaoPico({ vendas, atendimento }),
    vendasForaDoHorario: foraHoras.length ? { horas: foraHoras, janela: janela?.texto ?? "" } : null,
    fonteVendas: diag.fontes?.base?.arquivo ?? null,
  };
};

// ---- Aba 2 -----------------------------------------------------------------------------------------------------------

const vigenciaTexto = (r) => (r.vigencia === "hoje" ? "Em vigor" : `A partir de ${r.vigencia}`);
const nomeCabecalho = (r) => (r.id === "atual" ? "Hoje · 44h" : r.nome);
const resumoDaRegra = (r, convencao) => {
  if (r.id === "r42") return convencao ? "5 dias · até 8h24 por dia · teto de 42h" : "5 dias · até 8h por dia. Sem 8h24, na prática 40h";
  return String(r.descricao).replace("(regra atual)", "").replace(/teto (\d+h)/, "teto de $1");
};
// A função não está atendida: obrigatória sem horas ou turnos suficientes, ou meta sem horas suficientes.
const falta = (f) => (f.obrigatorio ? !f.okH || !f.okT : f.origemMeta !== "nenhuma" && !f.okH);

const saldoTexto = (f) => {
  if (!f.okH) return `faltam ${arred(-f.saldoH)}h`;
  if (f.saldoH > 0) return `sobram ${arred(f.saldoH)}h`;
  return f.obrigatorio ? "sem sobra nem falta" : "atinge a meta";
};

export const montarRegras = (diag, regraId) => {
  const convencao = !!diag.config?.convencao8h24;
  const funcoesNomes = (diag.regras[0]?.funcoes ?? []).map((f) => f.funcao).sort((a, b) => ORDEM_FUNCOES.indexOf(a) - ORDEM_FUNCOES.indexOf(b));
  const colunas = diag.regras.map((r) => {
    const faltando = r.funcoes.filter(falta).map((f) => f.funcao);
    return {
      id: r.id,
      nome: nomeCabecalho(r),
      vigencia: vigenciaTexto(r),
      resumo: resumoDaRegra(r, convencao),
      status: faltando.length ? "falta" : "atende",
      statusTexto: faltando.length === 0 ? "Atende" : faltando.length === 1 ? `Falta ${minuscula(faltando[0])}` : `Faltam ${faltando.length} funções`,
      destacada: r.id === regraId,
    };
  });
  const linhas = funcoesNomes.map((nome) => {
    const base = diag.regras[0].funcoes.find((f) => f.funcao === nome);
    const porRegra = diag.regras.map((r) => r.funcoes.find((f) => f.funcao === nome));
    // Todas as barras da função usam a mesma escala: o maior entre capacidades e necessidade.
    const escala = Math.max(1, ...porRegra.flatMap((f) => [f.capacidadeH, f.obrigatorio ? f.necessidadeH : f.metaH]));
    const precisa = base.obrigatorio ? base.necessidadeH : base.metaH;
    return {
      funcao: nome,
      obrigatorio: base.obrigatorio,
      apoio: base.obrigatorio ? "Obrigatório em todo o horário da loja" : base.origemMeta === "dono" ? "Meta do dono" : "Meta: manter o nível de hoje",
      precisaTexto: base.obrigatorio ? `Precisa de ${arred(base.necessidadeH)}h por semana e ${base.necessidadeT} turnos` : `Precisa de ${arred(base.metaH)}h por semana`,
      celulas: porRegra.map((f, i) => {
        const horasPorPessoa = f.pessoas ? arred(f.capacidadeH / f.pessoas) : 0;
        return {
          regraId: diag.regras[i].id,
          capacidadeH: arred(f.capacidadeH),
          ok: !falta(f),
          pessoasTexto: `${f.pessoas} ${f.pessoas === 1 ? "pessoa" : "pessoas"} × ${horasPorPessoa}h · ${saldoTexto(f)}`,
          turnosTexto: f.obrigatorio ? `${f.capacidadeT} turnos · ${f.saldoT >= 0 ? (f.saldoT === 0 ? "sem sobra" : `sobram ${f.saldoT}`) : `faltam ${-f.saldoT}`}` : null,
          barra: { capacidade: Math.min(1, f.capacidadeH / escala), precisa: Math.min(1, precisa / escala), falta: f.capacidadeH < precisa },
        };
      }),
    };
  });
  return { colunas, linhas, oito24: montarOito24(diag) };
};

// "E se a convenção permitir 8h24?": só com a convenção desligada e quando a estimativa reduz as horas que faltam.
export const montarOito24 = (diag) => {
  if (diag.config?.convencao8h24) return null;
  const r42 = diag.regras.find((r) => r.id === "r42");
  if (!r42?.com8h24) return null;
  let melhor = null;
  for (const novo of r42.com8h24.funcoes) {
    const hoje = r42.funcoes.find((f) => f.funcao === novo.funcao);
    if (!hoje) continue;
    const ganho = (hoje.gapH ?? 0) - (novo.gapH ?? 0);
    if (ganho > EPS && (!melhor || ganho > melhor.ganho)) melhor = { funcao: novo.funcao, comH: arred(novo.capacidadeH), faltariaH: arred(novo.gapH), faltaHoje: arred(hoje.gapH), ganho: arred(ganho) };
  }
  if (!melhor) return null;
  return { ...melhor, texto: `Com 5 dias de 8h24, a regra de 42h se cumpre inteira. O ${minuscula(melhor.funcao)} teria ${melhor.comH}h e ${melhor.faltariaH === 0 ? "não faltaria nada" : `faltariam ${melhor.faltariaH}h em vez de ${melhor.faltaHoje}h`}. É uma estimativa: nada muda no cadastro.`};
};

// ---- Aba 3 -----------------------------------------------------------------------------------------------------------

// "07:00–16:00" → { de, ate } em horas, ou nulo quando a pessoa não tem turno ("—").
export const lerTurno = (txt) => {
  const m = /^(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})$/.exec(String(txt ?? "").trim());
  return m ? { inicio: m[1], fim: m[2], de: horaDeTexto(m[1]), ate: horaDeTexto(m[2]) } : null;
};

// Barra do turno na linha do tempo: o que está dentro do horário da loja e o que está fora, em segmentos.
export const segmentosDoTurno = (turno, janelaHoras) => {
  if (!turno) return [];
  const pedacos = pedacosDeTurno({ inicio: turno.inicio, fim: turno.fim });
  const out = [];
  for (const p of pedacos) {
    const cortes = [p.de, p.ate, ...(janelaHoras ? [janelaHoras.abre, janelaHoras.fecha] : [])].filter((x) => x >= p.de && x <= p.ate).sort((a, b) => a - b);
    for (let i = 0; i < cortes.length - 1; i++) {
      const [de, ate] = [cortes[i], cortes[i + 1]];
      if (ate - de < EPS) continue;
      const meio = (de + ate) / 2;
      out.push({ de, ate, dentro: !janelaHoras || (meio >= janelaHoras.abre && meio < janelaHoras.fecha) });
    }
  }
  return out;
};

const diasEmTexto = (t) => String(t ?? "—").replace(/ a ([A-ZÁÉÍÓÚ])/, (_, c) => ` a ${c.toLowerCase()}`);

export const montarEquipe = (diag) => {
  const colab = diag.colaboradores ?? [];
  const noCalculo = colab.filter((c) => c.status === "ok");
  const fora = colab.filter((c) => c.status !== "ok");
  const horasDaLoja = diag.cobertura?.horas?.length ? { abre: Math.min(...diag.cobertura.horas), fecha: Math.max(...diag.cobertura.horas) + 1 } : janelaDaLoja(diag.loja?.horarios);
  const linhaDe = (c) => {
    const turno = c.status === "ok" ? lerTurno(c.turno) : null;
    return {
      matricula: c.matricula,
      nome: c.nome,
      dias: c.status === "ok" ? diasEmTexto(c.dias) : "—",
      turnoTexto: turno ? `${turno.inicio}–${turno.fim}` : "—",
      intervalo: c.status === "ok" ? c.intervalo : "—",
      cargaH: c.status === "ok" ? c.cargaH : null,
      situacao: c.status === "ok" ? "No cálculo" : "Fora do cálculo",
      noCalculo: c.status === "ok",
      motivo: c.status === "ok" ? null : "Sem função de escala, não entra no cálculo",
      turno,
      segmentos: segmentosDoTurno(turno, horasDaLoja),
    };
  };
  const totais = new Map((diag.quadro ?? []).map((q) => [q.funcao, q]));
  const nomes = [...new Set(colab.filter((c) => c.funcao).map((c) => c.funcao))].sort((a, b) => ORDEM_FUNCOES.indexOf(a) - ORDEM_FUNCOES.indexOf(b));
  const grupos = nomes.map((f) => {
    const t = totais.get(f);
    const doGrupo = colab.filter((c) => c.funcao === f);
    return { funcao: f, titulo: f, pessoas: t?.pessoas ?? doGrupo.length, horas: t?.cargaTotalH ?? doGrupo.reduce((s, c) => s + (c.cargaH ?? 0), 0), linhas: doGrupo.map(linhaDe) };
  });
  const semFuncao = colab.filter((c) => !c.funcao);
  if (semFuncao.length) grupos.push({ funcao: null, titulo: "Sem função de escala", pessoas: semFuncao.length, horas: null, linhas: semFuncao.map(linhaDe) });

  // Eixo da linha do tempo: de 06h a 22h, ampliado se alguém começar antes ou terminar depois.
  const turnos = grupos.flatMap((g) => g.linhas.map((l) => l.turno)).filter(Boolean);
  const eixoIni = Math.min(6, ...turnos.map((t) => Math.floor(Math.min(t.de, t.ate > t.de ? t.de : 0))));
  const eixoFim = Math.max(22, ...turnos.map((t) => (t.ate > t.de ? Math.ceil(t.ate) : 24)));
  return {
    total: colab.length,
    noCalculo: noCalculo.length,
    foraDoCalculo: fora.length,
    grupos,
    eixo: { ini: eixoIni, fim: eixoFim },
    janelaTexto: janelaDaLoja(diag.loja?.horarios)?.texto ?? null,
    janela: horasDaLoja,
  };
};

// Tudo da seção de uma vez (a tela memoriza por diagnóstico e regra).
export const montarSecao = (diag, regraId) => ({
  cobertura: montarCobertura(diag),
  regras: diag.regras?.length ? montarRegras(diag, regraId) : null,
  equipe: montarEquipe(diag),
});
