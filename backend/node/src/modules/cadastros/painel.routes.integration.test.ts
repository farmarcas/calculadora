import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GE_INICIAL_ID } from '../../shared/ge.js';
import { criarGe, limparGes, postLoja, reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN', 'X-GE': GE_INICIAL_ID };
const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };
const operador = { 'X-Perfil': 'PLATFORM_OPERATOR', 'X-GE': GE_INICIAL_ID };

const semana = (fecha = '20:00') => ({
  versao: 2,
  dias: [0, 1, 2, 3, 4, 5]
    .map(() => ({ aberta: true, abre: '08:00', fecha }))
    .concat([{ aberta: false } as never]),
});
const turno = (nome: string, inicio: string, fim: string, minimos: object = {}) => ({
  nome,
  inicio,
  fim,
  minimos: { Farmacêutico: 1, ...minimos },
});

describe('salvar tudo: PUT /lojas/:id/painel (spec 017)', () => {
  let lojaId: string;
  const salvar = (body: object, h: Record<string, string> = admin) =>
    reqGe().put(`/api/v1/lojas/${lojaId}/painel`).set(h).send(body);
  const doBanco = () => prisma.loja.findUniqueOrThrow({ where: { id: lojaId } });

  beforeEach(async () => {
    await prisma.auditoria.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    const c = await postLoja({ codigo: '001', nome: 'Centro', horarios: semana('21:00') });
    lojaId = c.body.id;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('o dono grava dados, funcionamento, faturamento, configuração e custos numa só chamada', async () => {
    const fat = { dias: [1000, 1000, 1000, 1000, 1000, 1000, null], mensal: null, margemPct: 30 };
    const r = await salvar({
      loja: { nome: 'Centro Novo', cidade: 'Sumaré', uf: 'SP', regimeTributario: 'real', horarios: semana(), faturamento: fat },
      configuracao: {
        convencao8h24: true,
        minimos: { Atendimento: 2 },
        turnos: [turno('Manhã', '08:00', '14:00'), turno('Tarde', '12:00', '22:00', { Atendimento: 3 })],
        modoMinimo: 'turnos',
      },
      custos: { salarioMedio: { Farmacêutico: 5000 }, encargos: { ratPct: 2 } },
    });
    expect(r.status).toBe(200);
    expect(r.body.loja).toMatchObject({ nome: 'Centro Novo', cidade: 'Sumaré', uf: 'SP', regimeTributario: 'real' });
    expect(r.body.loja.faturamento).toEqual(fat);
    expect(r.body.situacao.status).toBe('revisar'); // ainda sem farmacêutico na equipe
    const l = await doBanco();
    expect(l.convencao8h24).toBe(true);
    expect(l.minimos).toMatchObject({ Atendimento: 2 });
    expect((l.turnos as { turnos: unknown[] }).turnos).toHaveLength(2);
    expect(l.custos).toMatchObject({ salarioMedio: { Farmacêutico: 5000 } });
    // Turnos sobrepostos e passando do fechamento (20:00): sem erro; só aviso se houver buraco.
    expect(r.body.avisosDeTurnos).toEqual([]);
    expect((await prisma.auditoria.findMany({ where: { acao: 'loja.painel' } })).length).toBe(1);
  });

  it('se um bloco é inválido, NADA é gravado (nem os blocos válidos)', async () => {
    const antes = await doBanco();
    const r = await salvar({
      loja: { nome: 'Nome que não pode ficar' },
      configuracao: { turnos: [turno('A', '08:00', '08:00')] }, // início = fim
    });
    expect(r.status).toBe(400);
    expect(JSON.stringify(r.body)).toContain('iguais');
    const depois = await doBanco();
    expect(depois.nome).toBe(antes.nome);
    expect(depois.turnos).toBeNull();

    const ruim = await salvar({
      loja: { nome: 'Outro nome' },
      custos: { salarioMedio: { Farmacêutico: 5000 }, encargos: { ratPct: 9 } }, // RAT fora de 1 a 3
    });
    expect(ruim.status).toBe(400);
    expect((await doBanco()).nome).toBe(antes.nome);
  });

  it('corpo vazio ou com campo desconhecido é recusado', async () => {
    expect((await salvar({})).status).toBe(400);
    expect((await salvar({ extra: 1 })).status).toBe(400);
    expect((await salvar({ loja: { nome: 'X' } })).status).toBe(400); // nome com menos de 2 letras
  });

  it('permissões: faturamento e custos só do dono; configuração não é do operador; consulta não grava', async () => {
    const fat = { dias: [1, 1, 1, 1, 1, 1, null], mensal: null, margemPct: null };
    const g = await salvar({ loja: { faturamento: fat } }, gestor);
    expect(g.status).toBe(403);
    expect((await salvar({ custos: { salarioMedio: { Caixa: 2000 } } }, gestor)).status).toBe(403);
    expect((await salvar({ configuracao: { convencao8h24: true } }, operador)).status).toBe(403);
    expect((await salvar({ loja: { cidade: 'X' } }, consulta)).status).toBe(403);
    const ok = await salvar({ loja: { cidade: 'Campinas' }, configuracao: { convencao8h24: true } }, gestor);
    expect(ok.status).toBe(200);
    // O gestor recebe a loja sem o faturamento.
    expect(ok.body.loja).not.toHaveProperty('faturamento');
    const op = await salvar({ loja: { cidade: 'Jundiaí' } }, operador);
    expect(op.status).toBe(200);
  });

  it('código e CNPJ: só o operador muda, e sem duplicar', async () => {
    const outra = await postLoja({ codigo: '002', nome: 'Outra' });
    expect((await salvar({ loja: { codigo: '777' } }, admin)).status).toBe(400);
    expect((await salvar({ loja: { codigo: '002' } }, operador)).status).toBe(409);
    expect((await salvar({ loja: { cnpj: outra.body.cnpj } }, operador)).status).toBe(409);
    expect((await salvar({ loja: { codigo: '555' } }, operador)).status).toBe(200);
    expect((await doBanco()).codigo).toBe('555');
  });

  it('modo do mínimo sozinho mantém os turnos; limpar o faturamento com null', async () => {
    await salvar({ configuracao: { turnos: [turno('Dia', '08:00', '20:00')] } });
    await salvar({ configuracao: { modoMinimo: 'unico' } });
    expect(await doBanco()).toMatchObject({ turnos: { modo: 'unico', turnos: [{ nome: 'Dia' }] } });
    await salvar({ loja: { faturamento: { dias: [1, 1, 1, 1, 1, 1, null], mensal: null, margemPct: null } } });
    const r = await salvar({ loja: { faturamento: null } });
    expect(r.status).toBe(200);
    expect(r.body.loja.faturamento ?? null).toBeNull();
  });

  it('turnos com buraco gravam e devolvem o aviso "Sem turno entre …"', async () => {
    const r = await salvar({ configuracao: { turnos: [turno('A', '08:00', '12:00'), turno('B', '14:00', '21:00')] } });
    expect(r.status).toBe(200);
    expect(r.body.avisosDeTurnos.join(' ')).toContain('Sem turno entre 12:00 e 14:00');
  });

  it('loja de outro grupo não existe para quem chama; GET devolve o estado atual', async () => {
    const outro = await criarGe('G-PAINEL', 'Outro grupo');
    const l2 = await postLoja({ codigo: '009', nome: 'Do outro' }, outro.id);
    const r = await reqGe().put(`/api/v1/lojas/${l2.body.id}/painel`).set(admin).send({ loja: { cidade: 'X' } });
    expect(r.status).toBe(404);
    const g = await reqGe().get(`/api/v1/lojas/${lojaId}/painel`).set(admin);
    expect(g.status).toBe(200);
    expect(g.body.situacao).toHaveProperty('status');
    await prisma.loja.deleteMany({ where: { geId: outro.id } });
    await limparGes();
  });
});
