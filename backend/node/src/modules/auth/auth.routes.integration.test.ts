import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';
import { SignJWT } from 'jose';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import type { ConfigSso } from '../../config/env.js';
import { prisma } from '../../shared/database/prisma.js';
import { cnpjValido, limparGes } from '../../shared/testing/ge.js';
import {
  loginInvalido,
  radarIndisponivel,
  type GrupoDoRadar,
  type LojaDoRadar,
  type RadarClient,
  type UsuarioDoRadar,
} from './radar.client.js';

const sso: ConfigSso = {
  radarAuthUrl: 'https://auth.exemplo/',
  clientId: 'calculadora',
  clientSecret: 'segredo',
  slug: 'Calculadora',
  jwtSegredo: 'x'.repeat(32),
  sessaoHoras: 8,
  cookieSeguro: false,
};

const codigos = new Map<string, UsuarioDoRadar>();
const acessos = new Map<string, UsuarioDoRadar>();
const gruposDoCodigo = new Map<string, GrupoDoRadar[] | undefined>();
let radarFora = false;

const radar: RadarClient = {
  async trocarCodigo(code) {
    if (radarFora) throw radarIndisponivel();
    const achado = codigos.get(code);
    if (!achado) throw loginInvalido();
    codigos.delete(code);
    const accessToken = randomUUID();
    acessos.set(accessToken, achado);
    return { accessToken, economicGroups: gruposDoCodigo.get(code) };
  },
  async lerUsuario(accessToken) {
    return acessos.get(accessToken)!;
  },
};

const app = createApp({ sso, radar });

const GESTAO_DE_ESCALA = { farmarcasSystem: 'Management', key: 'ManagementWorkSchedule' };

const usuario = (over: Partial<UsuarioDoRadar> = {}): UsuarioDoRadar => ({
  id: '77',
  name: 'Ana',
  email: 'ana@exemplo.com',
  role: { name: 'User' },
  stores: [],
  permissions: [GESTAO_DE_ESCALA],
  ...over,
});

let proximaLoja = 1000;
const lojaRadar = (grupo: number, over: Partial<LojaDoRadar> = {}): LojaDoRadar => ({
  id: String(proximaLoja++),
  name: 'Loja do Radar',
  cnpj: cnpjValido(),
  status: 2,
  economicGroup: { id: String(grupo), name: `Grupo ${grupo}` },
  ...over,
});

const entrar = async (u: UsuarioDoRadar, economicGroups?: GrupoDoRadar[]) => {
  const agente = request.agent(app);
  const code = randomUUID();
  codigos.set(code, u);
  gruposDoCodigo.set(code, economicGroups);
  const resposta = await agente.post('/api/v1/auth/sso/exchange').send({ code });
  return { agente, resposta, code };
};

const criarGrupo = (identificacao: string) =>
  prisma.grupoEconomico.create({ data: { identificacao, nome: `Grupo ${identificacao}` } });

const criarLoja = (geId: string, codigo: string, cnpj = cnpjValido()) =>
  prisma.loja.create({ data: { geId, codigo, nome: `Loja ${codigo}`, cnpj } });

const criarFuncionario = (geId: string, lojaId: string, matricula: string) =>
  prisma.funcionario.create({ data: { geId, lojaId, matricula, nome: `Pessoa ${matricula}` } });

const criarSimulacao = (lojaId: string) =>
  prisma.simulacao.create({
    data: { lojaId, nome: 'Cenário', regra: 'r42', autor: 'teste', quadro: [] },
  });

const cookies = (resposta: request.Response) =>
  resposta.headers['set-cookie'] as unknown as string[];

const cookieDaSessao = (resposta: request.Response) =>
  cookies(resposta).find((c) => c.startsWith('calc_sessao='))!;

const planilha = async () => {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Lojas').addRows([['Cod_Loja'], ['1']]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};

const baseComercial = async (codigo: string) => {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Dados').addRows([
    ['Data', 'Hora', 'Cod_Loja', 'Venda_Liquida_RS', 'Clientes_Atendidos'],
    ['01/09/2026', '18', codigo, '1.200,00', '40'],
  ]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};

const ROTAS_DE_DADOS: ['get' | 'post' | 'put' | 'patch' | 'delete', string][] = [
  ['get', '/api/v1/users'],
  ['post', '/api/v1/users'],
  ['get', '/api/v1/ge'],
  ['get', '/api/v1/ge/resumo'],
  ['post', '/api/v1/ge'],
  ['patch', '/api/v1/ge/1'],
  ['get', '/api/v1/parametros-legais'],
  ['post', '/api/v1/parametros-legais'],
  ['get', '/api/v1/parametros-encargos'],
  ['post', '/api/v1/parametros-encargos'],
  ['get', '/api/v1/cargas-lojas/modelo'],
  ['post', '/api/v1/cargas-lojas'],
  ['post', '/api/v1/cargas-lojas/1/confirmar'],
  ['get', '/api/v1/planilha-modelo'],
  ['get', '/api/v1/planilha-modelo-base'],
  ['post', '/api/v1/importacoes/cadastro'],
  ['post', '/api/v1/importacoes/cadastro/1/revisar'],
  ['post', '/api/v1/importacoes/cadastro/1/confirmar'],
  ['get', '/api/v1/lojas'],
  ['post', '/api/v1/lojas'],
  ['patch', '/api/v1/lojas/1'],
  ['delete', '/api/v1/lojas/1'],
  ['get', '/api/v1/lojas/1/painel'],
  ['put', '/api/v1/lojas/1/painel'],
  ['get', '/api/v1/lojas/1/custos'],
  ['put', '/api/v1/lojas/1/custos'],
  ['get', '/api/v1/lojas/1/diagnostico'],
  ['get', '/api/v1/lojas/1/cargas'],
  ['put', '/api/v1/lojas/1/configuracao'],
  ['get', '/api/v1/lojas/1/simulacoes'],
  ['post', '/api/v1/lojas/1/simulacoes'],
  ['get', '/api/v1/lojas/1/simulacoes/comparar'],
  ['get', '/api/v1/simulacoes/1'],
  ['put', '/api/v1/simulacoes/1'],
  ['post', '/api/v1/simulacoes/1/gravar'],
  ['post', '/api/v1/simulacoes/1/descartar'],
  ['post', '/api/v1/simulacoes/1/clonar'],
  ['get', '/api/v1/simulacoes/1/exportar.xlsx'],
  ['get', '/api/v1/funcionarios'],
  ['post', '/api/v1/funcionarios'],
  ['patch', '/api/v1/funcionarios/1'],
  ['delete', '/api/v1/funcionarios/1'],
  ['post', '/api/v1/cargas/base'],
  ['post', '/api/v1/cargas/base/revisar'],
];

describe('login pelo Radar', () => {
  beforeEach(async () => {
    radarFora = false;
    codigos.clear();
    acessos.clear();
    gruposDoCodigo.clear();
    await prisma.sessao.deleteMany();
    await prisma.auditoria.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    await prisma.importacaoCadastro.deleteMany();
    await limparGes();
  });

  afterAll(async () => {
    await prisma.sessao.deleteMany();
    await prisma.$disconnect();
  });

  describe('sem sessão', () => {
    it.each(ROTAS_DE_DADOS)('%s %s responde 401', async (metodo, url) => {
      const resposta = await request(app)[metodo](url).set('X-Perfil', 'PLATFORM_OPERATOR');

      expect(resposta.status).toBe(401);
      expect(resposta.body.error.code).toBe('NAO_AUTENTICADO');
    });

    it('mantém a saúde aberta', async () => {
      expect((await request(app).get('/health')).status).toBe(200);
      expect((await request(app).get('/health/ready')).status).toBe(200);
    });

    it('responde 401 em /auth/sessao', async () => {
      expect((await request(app).get('/api/v1/auth/sessao')).status).toBe(401);
    });

    it('recusa token assinado com outro segredo', async () => {
      const falso = await new SignJWT({ sid: randomUUID() })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode('y'.repeat(32)));

      const resposta = await request(app).get('/api/v1/ge').set('Cookie', `calc_sessao=${falso}`);

      expect(resposta.status).toBe(401);
    });
  });

  describe('entrada', () => {
    it('não existe caminho de login na calculadora: quem entra vem do Radar', async () => {
      const resposta = await request(app).get('/api/v1/auth/login');

      expect(resposta.status).toBe(401);
      expect(resposta.body.error.code).toBe('NAO_AUTENTICADO');
    });

    it('abre o retorno do Radar sem nada guardado no navegador', async () => {
      const code = randomUUID();
      codigos.set(code, usuario({ stores: [lojaRadar(250)] }));

      const resposta = await request(app).post('/api/v1/auth/sso/exchange').send({ code });

      expect(resposta.status).toBe(200);
      expect(cookieDaSessao(resposta)).toBeTruthy();
    });
  });

  describe('retorno', () => {
    it('abre a sessão num cookie que a página não lê, sem expor o token', async () => {
      const { agente, resposta } = await entrar(usuario({ stores: [lojaRadar(250)] }));

      expect(resposta.status).toBe(200);
      expect(cookieDaSessao(resposta)).toMatch(/Path=\/api;.*HttpOnly; SameSite=Lax/);
      expect(JSON.stringify(resposta.body)).not.toContain('accessToken');
      expect(resposta.body).toMatchObject({
        sso: true,
        usuario: { nome: 'Ana', email: 'ana@exemplo.com' },
        operador: false,
        grupos: [
          { nome: 'Grupo 250', identificacao: '250', perfil: 'TENANT_ADMIN', acessoTotal: true },
        ],
      });
      expect((await agente.get('/api/v1/auth/sessao')).body).toEqual(resposta.body);
    });

    it('valida o corpo', async () => {
      const resposta = await request(app).post('/api/v1/auth/sso/exchange').send({});

      expect(resposta.status).toBe(400);
      expect(resposta.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('recusa código desconhecido', async () => {
      const resposta = await request(app)
        .post('/api/v1/auth/sso/exchange')
        .send({ code: 'inventado' });

      expect(resposta.status).toBe(401);
      expect(resposta.body.error.code).toBe('LOGIN_INVALIDO');
    });

    it('recusa código já usado', async () => {
      const { agente, code } = await entrar(usuario({ stores: [lojaRadar(250)] }));

      const resposta = await agente.post('/api/v1/auth/sso/exchange').send({ code });

      expect(resposta.status).toBe(401);
      expect(await prisma.sessao.count()).toBe(1);
    });

    it('responde 503 com a API do Radar fora do ar na volta', async () => {
      radarFora = true;

      const resposta = await request(app).post('/api/v1/auth/sso/exchange').send({ code: 'abc' });

      expect(resposta.status).toBe(503);
    });
  });

  describe('permissão Gestão de Escala', () => {
    it.each(['Admin', 'Angel', 'User'])(
      '%s com a permissão entra como dono do grupo das suas lojas',
      async (name) => {
        const { resposta } = await entrar(
          usuario({ role: { name }, stores: [lojaRadar(250), lojaRadar(251)] }),
        );

        expect(resposta.status).toBe(200);
        expect(resposta.body.operador).toBe(false);
        expect(resposta.body.grupos.map((g: { perfil: string }) => g.perfil)).toEqual([
          'TENANT_ADMIN',
          'TENANT_ADMIN',
        ]);
      },
    );

    it('sem a lista do Radar, Admin só vê os grupos das suas lojas e não vira operador', async () => {
      await criarGrupo('900');

      const { agente } = await entrar(
        usuario({ role: { name: 'Admin' }, stores: [lojaRadar(250)] }),
      );

      const ge = await agente.get('/api/v1/ge');
      expect(ge.body.data.map((g: { identificacao: string }) => g.identificacao)).toEqual(['250']);
      expect((await agente.get('/api/v1/users')).status).toBe(403);
    });

    it.each([
      ['sem permissão nenhuma', []],
      ['só com o card Escala', [{ farmarcasSystem: 'Management', key: 'AccessWorkSchedule' }]],
    ])('%s não entra e nada é gravado', async (_, permissions) => {
      const { resposta } = await entrar(usuario({ permissions, stores: [lojaRadar(250)] }));

      expect(resposta.status).toBe(403);
      expect(resposta.body.error.code).toBe('SEM_ACESSO');
      expect(await prisma.sessao.count()).toBe(0);
      expect(await prisma.loja.count()).toBe(0);
    });

    it('com a permissão, sem nenhuma loja e sem a lista do Radar não entra', async () => {
      const { resposta } = await entrar(usuario({ role: { name: 'Admin' }, stores: [] }));

      expect(resposta.status).toBe(403);
      expect(resposta.body.error.code).toBe('SEM_ACESSO');
    });
  });

  describe('Admin com todos os grupos (lista do Radar)', () => {
    const ADMIN = { name: 'Admin' };
    const inteiro = (n: number, name = `Grupo ${n}`): GrupoDoRadar => ({
      id: String(n),
      name,
      fullAccess: true,
    });
    const nomes = (body: { data: { nome: string }[] }) => body.data.map((g) => g.nome);

    it('entra sem lojas vinculadas e vê todos os grupos em ordem alfabética', async () => {
      const { resposta, agente } = await entrar(usuario({ role: ADMIN, stores: [] }), [
        inteiro(300, 'Zeta'),
        inteiro(301, 'Alfa'),
        inteiro(302, 'Meio'),
      ]);

      expect(resposta.status).toBe(200);
      expect(resposta.body.operador).toBe(false);
      expect(nomes((await agente.get('/api/v1/ge')).body)).toEqual(['Alfa', 'Meio', 'Zeta']);
      expect(
        resposta.body.grupos.every(
          (g: { perfil: string; acessoTotal: boolean }) =>
            g.perfil === 'TENANT_ADMIN' && g.acessoTotal,
        ),
      ).toBe(true);
      expect((await agente.get('/api/v1/users')).status).toBe(403);
    });

    it('cria o grupo que falta sem lojas e não troca o nome do que já existe', async () => {
      await criarGrupo('300');

      await entrar(usuario({ role: ADMIN }), [inteiro(300, 'Outro nome'), inteiro(301, 'Novo')]);

      const grupos = await prisma.grupoEconomico.findMany({
        where: { identificacao: { in: ['300', '301'] } },
        orderBy: { identificacao: 'asc' },
        select: { identificacao: true, nome: true, _count: { select: { lojas: true } } },
      });
      expect(grupos).toEqual([
        { identificacao: '300', nome: 'Grupo 300', _count: { lojas: 0 } },
        { identificacao: '301', nome: 'Novo', _count: { lojas: 0 } },
      ]);
    });

    it('grupo desativado na calculadora fica fora', async () => {
      const ge = await criarGrupo('300');
      await prisma.grupoEconomico.update({ where: { id: ge.id }, data: { ativo: false } });

      const { agente } = await entrar(usuario({ role: ADMIN }), [inteiro(300), inteiro(301)]);

      const lista = await agente.get('/api/v1/ge');
      expect(lista.body.data.map((g: { identificacao: string }) => g.identificacao)).toEqual([
        '301',
      ]);
      const fora = await agente.get('/api/v1/lojas').set('X-GE', ge.id);
      expect(fora.status).toBe(403);
      expect(fora.body.error.code).toBe('GE_INDISPONIVEL');
    });

    it('vinculado a 1 de 3 lojas do grupo, vê e abre as 3', async () => {
      const ge = await criarGrupo('250');
      const minha = await criarLoja(ge.id, 'L1');
      const outra = await criarLoja(ge.id, 'L2');
      await criarLoja(ge.id, 'L3');

      const { agente } = await entrar(
        usuario({ role: ADMIN, stores: [lojaRadar(250, { cnpj: minha.cnpj })] }),
        [inteiro(250)],
      );

      const lojas = await agente.get('/api/v1/lojas').set('X-GE', ge.id);
      expect(lojas.body.meta.total).toBe(3);
      expect((await agente.get(`/api/v1/lojas/${outra.id}/painel`).set('X-GE', ge.id)).status).toBe(
        200,
      );
    });

    it('sem a permissão Gestão de Escala não entra, mesmo com a lista', async () => {
      const { resposta } = await entrar(usuario({ role: ADMIN, permissions: [] }), [inteiro(300)]);

      expect(resposta.status).toBe(403);
      expect(await prisma.grupoEconomico.count({ where: { identificacao: '300' } })).toBe(0);
    });

    it('associado com a lista sem acesso inteiro continua só com as suas lojas', async () => {
      const ge = await criarGrupo('250');
      const minha = await criarLoja(ge.id, 'L1');
      await criarLoja(ge.id, 'L2');
      await criarGrupo('251');

      const { agente } = await entrar(usuario({ stores: [lojaRadar(250, { cnpj: minha.cnpj })] }), [
        { id: '250', name: 'Grupo 250', fullAccess: false },
        { id: '251', name: 'Grupo 251', fullAccess: false },
      ]);

      const lista = await agente.get('/api/v1/ge');
      expect(lista.body.data.map((g: { identificacao: string }) => g.identificacao)).toEqual([
        '250',
      ]);
      const lojas = await agente.get('/api/v1/lojas').set('X-GE', ge.id);
      expect(lojas.body.data.map((l: { id: string }) => l.id)).toEqual([minha.id]);
    });

    it('entra com 2.000 grupos em menos de 5 segundos', async () => {
      const lista = Array.from({ length: 2000 }, (_, i) => inteiro(10000 + i));

      const inicio = Date.now();
      const { resposta, agente } = await entrar(usuario({ role: ADMIN }), lista);
      const tempo = Date.now() - inicio;

      expect(resposta.status).toBe(200);
      expect(tempo).toBeLessThan(5000);
      expect((await agente.get('/api/v1/ge')).body.data).toHaveLength(2000);
    });

    it('lista vazia e nenhuma loja não entra', async () => {
      const { resposta } = await entrar(usuario({ role: ADMIN, stores: [] }), []);

      expect(resposta.status).toBe(403);
      expect(resposta.body.error.code).toBe('SEM_ACESSO');
    });
  });

  describe('grupos e lojas no login', () => {
    it('cria o que falta só com número, nome e CNPJ', async () => {
      const loja = lojaRadar(250, { id: '4321', name: 'Farmácia Centro' });

      await entrar(usuario({ stores: [loja] }));

      const criada = await prisma.loja.findFirstOrThrow({
        where: { cnpj: loja.cnpj! },
        include: { ge: true },
      });
      expect(criada).toMatchObject({
        codigo: '4321',
        nome: 'Farmácia Centro',
        uf: null,
        horarios: null,
        custos: null,
        ultimaCarga: null,
        ge: { identificacao: '250', nome: 'Grupo 250', responsavel: null, ativo: true },
      });
    });

    it('não sobrescreve o que já existe', async () => {
      const ge = await criarGrupo('250');
      const existente = await criarLoja(ge.id, 'L1');

      await entrar(
        usuario({
          stores: [lojaRadar(250, { cnpj: existente.cnpj, name: 'Nome novo' })],
        }),
      );

      const depois = await prisma.loja.findUniqueOrThrow({
        where: { id: existente.id },
        include: { ge: true },
      });
      expect(depois.nome).toBe('Loja L1');
      expect(depois.codigo).toBe('L1');
      expect(depois.ge.nome).toBe('Grupo 250');
      expect(await prisma.loja.count()).toBe(1);
    });

    it('acha a loja pelo CNPJ mesmo com número de grupo diferente', async () => {
      const ge = await criarGrupo('111');
      const existente = await criarLoja(ge.id, 'L1');

      const { resposta } = await entrar(
        usuario({ stores: [lojaRadar(999, { cnpj: existente.cnpj })] }),
      );

      expect(resposta.body.grupos.map((g: { id: string }) => g.id)).toEqual([ge.id]);
      expect(await prisma.grupoEconomico.count({ where: { identificacao: '999' } })).toBe(0);
    });

    it('loja excluída não volta', async () => {
      const ge = await criarGrupo('250');
      const excluida = await criarLoja(ge.id, 'L1');
      await prisma.loja.update({ where: { id: excluida.id }, data: { deletedAt: new Date() } });

      const { resposta } = await entrar(
        usuario({ stores: [lojaRadar(250, { cnpj: excluida.cnpj })] }),
      );

      expect(resposta.status).toBe(403);
      expect(await prisma.loja.count({ where: { deletedAt: null } })).toBe(0);
    });

    it('grupo desativado fica fora do acesso', async () => {
      const ge = await criarGrupo('250');
      await prisma.grupoEconomico.update({ where: { id: ge.id }, data: { ativo: false } });

      const { resposta } = await entrar(usuario({ stores: [lojaRadar(250)] }));

      expect(resposta.status).toBe(403);
      expect(await prisma.loja.count()).toBe(0);
    });

    it('ignora loja desativada, sem grupo ou sem CNPJ sem impedir o login', async () => {
      const boa = lojaRadar(250);

      const { resposta } = await entrar(
        usuario({
          stores: [
            boa,
            lojaRadar(250, { status: 0 }),
            lojaRadar(250, { economicGroup: null }),
            lojaRadar(250, { cnpj: null }),
          ],
        }),
      );

      expect(resposta.status).toBe(200);
      expect(await prisma.loja.count()).toBe(1);
    });

    it('dois logins ao mesmo tempo não falham nem duplicam', async () => {
      const stores = [lojaRadar(250), lojaRadar(250)];

      const [a, b] = await Promise.all([
        entrar(usuario({ stores })),
        entrar(usuario({ id: '78', stores })),
      ]);

      expect(a.resposta.status).toBe(200);
      expect(b.resposta.status).toBe(200);
      expect(await prisma.loja.count()).toBe(2);
      expect(await prisma.grupoEconomico.count({ where: { identificacao: '250' } })).toBe(1);
    });
  });

  describe('grupo e perfil informados pelo navegador', () => {
    it('recusa grupo fora do acesso, como grupo inexistente', async () => {
      const outro = await criarGrupo('300');
      const { agente } = await entrar(usuario({ stores: [lojaRadar(250)] }));

      const fora = await agente.get('/api/v1/lojas').set('X-GE', outro.id);
      const inexistente = await agente.get('/api/v1/lojas').set('X-GE', randomUUID());

      expect(fora.status).toBe(403);
      expect(fora.body).toEqual(inexistente.body);
      expect(fora.body.error.code).toBe('GE_INDISPONIVEL');
    });

    it('lista só os grupos da sessão', async () => {
      await criarGrupo('300');
      const { agente } = await entrar(usuario({ stores: [lojaRadar(250), lojaRadar(251)] }));

      const { body } = await agente.get('/api/v1/ge');

      expect(body.data.map((g: { identificacao: string }) => g.identificacao).sort()).toEqual([
        '250',
        '251',
      ]);
    });

    it('ignora X-Perfil', async () => {
      const { agente, resposta } = await entrar(usuario({ stores: [lojaRadar(250)] }));
      const geId = resposta.body.grupos[0].id;

      const resumo = await agente
        .get('/api/v1/ge/resumo')
        .set({ 'X-GE': geId, 'X-Perfil': 'PLATFORM_OPERATOR' });
      const usuarios = await agente.get('/api/v1/users').set('X-Perfil', 'PLATFORM_OPERATOR');

      expect(resumo.status).toBe(403);
      expect(usuarios.status).toBe(403);
    });
  });

  describe('acesso a parte das lojas do grupo', () => {
    const preparar = async () => {
      const ge = await criarGrupo('250');
      const minha = await criarLoja(ge.id, 'L1');
      const minha2 = await criarLoja(ge.id, 'L2');
      const alheia = await criarLoja(ge.id, 'L3');
      const pessoaMinha = await criarFuncionario(ge.id, minha.id, 'M1');
      const pessoaAlheia = await criarFuncionario(ge.id, alheia.id, 'M2');
      const simMinha = await criarSimulacao(minha.id);
      const simAlheia = await criarSimulacao(alheia.id);
      const { agente } = await entrar(
        usuario({
          stores: [lojaRadar(250, { cnpj: minha.cnpj }), lojaRadar(250, { cnpj: minha2.cnpj })],
        }),
      );
      const http = {
        get: (url: string) => agente.get(url).set('X-GE', ge.id),
        post: (url: string) => agente.post(url).set('X-GE', ge.id),
        put: (url: string) => agente.put(url).set('X-GE', ge.id),
        patch: (url: string) => agente.patch(url).set('X-GE', ge.id),
        delete: (url: string) => agente.delete(url).set('X-GE', ge.id),
      };
      return { ge, minha, minha2, alheia, pessoaMinha, pessoaAlheia, simMinha, simAlheia, http };
    };

    it('lista só as lojas e funcionários do acesso', async () => {
      const { minha, minha2, pessoaMinha, http } = await preparar();

      const lojas = await http.get('/api/v1/lojas');
      const funcionarios = await http.get('/api/v1/funcionarios');

      expect(lojas.body.data.map((l: { id: string }) => l.id).sort()).toEqual(
        [minha.id, minha2.id].sort(),
      );
      expect(lojas.body.meta.total).toBe(2);
      expect(funcionarios.body.data.map((f: { id: string }) => f.id)).toEqual([pessoaMinha.id]);
    });

    it('abre o que é do acesso', async () => {
      const { minha, simMinha, pessoaMinha, http } = await preparar();

      expect((await http.get(`/api/v1/lojas/${minha.id}/painel`)).status).toBe(200);
      expect((await http.get(`/api/v1/simulacoes/${simMinha.id}`)).status).toBe(200);
      expect((await http.get(`/api/v1/funcionarios?lojaId=${minha.id}`)).status).toBe(200);
      expect(
        (await http.patch(`/api/v1/funcionarios/${pessoaMinha.id}`).send({ nome: 'Outro nome' }))
          .status,
      ).toBe(200);
    });

    it('responde como inexistente para loja, simulação e funcionário fora do acesso', async () => {
      const { alheia, pessoaAlheia, simAlheia, http } = await preparar();

      const pedidos = [
        () => http.get(`/api/v1/lojas/${alheia.id}/painel`),
        () => http.put(`/api/v1/lojas/${alheia.id}/painel`).send({}),
        () => http.get(`/api/v1/lojas/${alheia.id}/custos`),
        () => http.get(`/api/v1/lojas/${alheia.id}/diagnostico`),
        () => http.get(`/api/v1/lojas/${alheia.id}/cargas`),
        () => http.get(`/api/v1/lojas/${alheia.id}/simulacoes`),
        () => http.post(`/api/v1/lojas/${alheia.id}/simulacoes`).send({ nome: 'Cenário' }),
        () => http.patch(`/api/v1/lojas/${alheia.id}`).send({ nome: 'Outro nome' }),
        () => http.get(`/api/v1/funcionarios?lojaId=${alheia.id}`),
        () => http.get(`/api/v1/simulacoes/${simAlheia.id}`),
        () => http.get(`/api/v1/simulacoes/${simAlheia.id}/exportar.xlsx`),
        () => http.post(`/api/v1/simulacoes/${simAlheia.id}/descartar`),
        () => http.patch(`/api/v1/funcionarios/${pessoaAlheia.id}`).send({ nome: 'Outro nome' }),
        () => http.delete(`/api/v1/funcionarios/${pessoaAlheia.id}`),
      ];

      for (const pedido of pedidos) expect((await pedido()).status).toBe(404);
    });

    it('não leva funcionário nem cria funcionário em loja fora do acesso', async () => {
      const { alheia, pessoaMinha, http } = await preparar();

      const mover = await http
        .patch(`/api/v1/funcionarios/${pessoaMinha.id}`)
        .send({ lojaId: alheia.id });
      const criar = await http
        .post('/api/v1/funcionarios')
        .send({ matricula: 'M9', nome: 'Nova Pessoa', lojaId: alheia.id });

      expect(mover.status).toBe(404);
      expect(criar.status).toBe(404);
      expect(await prisma.funcionario.count({ where: { lojaId: alheia.id } })).toBe(1);
    });

    it('recusa as importações do grupo inteiro e rotas fora da tabela', async () => {
      const { minha, http } = await preparar();
      const arquivo = await planilha();

      const pedidos = [
        () => http.post('/api/v1/importacoes/cadastro').attach('arquivo', arquivo, 'a.xlsx'),
        () => http.post('/api/v1/cargas/base').attach('arquivo', arquivo, 'a.xlsx'),
        () => http.post('/api/v1/cargas/base/revisar').attach('arquivo', arquivo, 'a.xlsx'),
        () => http.delete(`/api/v1/lojas/${minha.id}`),
      ];

      for (const pedido of pedidos) {
        const resposta = await pedido();
        expect(resposta.status).toBe(403);
        expect(resposta.body.error.code).toBe('SEM_PERMISSAO');
      }
    });

    it('quem tem todas as lojas do grupo não passa pela guarda', async () => {
      const ge = await criarGrupo('250');
      const loja = await criarLoja(ge.id, 'L1');
      const { agente } = await entrar(usuario({ stores: [lojaRadar(250, { cnpj: loja.cnpj })] }));

      const resposta = await agente
        .post('/api/v1/importacoes/cadastro')
        .set('X-GE', ge.id)
        .attach('arquivo', await planilha(), 'a.xlsx');

      expect(resposta.status).toBe(201);
    });
  });

  describe('sair e fim da sessão', () => {
    it('"Sair" invalida o cookie na hora', async () => {
      const { agente, resposta } = await entrar(usuario({ stores: [lojaRadar(250)] }));

      const saida = await agente.post('/api/v1/auth/sair');
      const reaproveitado = await request(app)
        .get('/api/v1/ge')
        .set('Cookie', cookieDaSessao(resposta).split(';')[0]!);

      expect(saida.status).toBe(204);
      expect(cookies(saida)[0]).toMatch(/^calc_sessao=;/);
      expect(reaproveitado.status).toBe(401);
    });

    it('"Sair" sem sessão responde 204', async () => {
      expect((await request(app).post('/api/v1/auth/sair')).status).toBe(204);
    });

    it('sessão vencida é recusada', async () => {
      const { agente } = await entrar(usuario({ stores: [lojaRadar(250)] }));
      await prisma.sessao.updateMany({ data: { expiraEm: new Date(Date.now() - 1000) } });

      expect((await agente.get('/api/v1/ge')).status).toBe(401);
    });

    it('apaga as sessões vencidas há mais de 7 dias a cada login', async () => {
      const antiga = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      await prisma.sessao.create({
        data: { radarUsuarioId: '1', nome: 'A', email: 'a@b', grupos: [], expiraEm: antiga },
      });

      await entrar(usuario({ stores: [lojaRadar(250)] }));

      expect(await prisma.sessao.count()).toBe(1);
    });
  });

  describe('auditoria', () => {
    it('registra quem fez, inclusive depois do envio de arquivo', async () => {
      const { agente, resposta } = await entrar(usuario({ stores: [lojaRadar(250)] }));
      const geId = resposta.body.grupos[0].id;
      const loja = await prisma.loja.findFirstOrThrow();

      await agente
        .patch(`/api/v1/lojas/${loja.id}`)
        .set('X-GE', geId)
        .send({ nome: 'Novo nome' })
        .expect(200);
      await agente
        .post('/api/v1/cargas/base')
        .set('X-GE', geId)
        .field('preenchimento', 'x'.repeat(900_000))
        .attach('arquivo', await baseComercial(loja.codigo), 'base.xlsx')
        .expect(201);

      const registros = await prisma.auditoria.findMany();
      expect(registros.map((r) => r.acao).sort()).toEqual([
        'base-comercial.importada',
        'loja.editada',
      ]);
      for (const registro of registros)
        expect(registro).toMatchObject({ usuarioId: '77', usuarioNome: 'Ana' });
    });
  });

  describe('login desligado', () => {
    const semLogin = createApp({ sso: null });

    it('informa o modo demonstração', async () => {
      expect((await request(semLogin).get('/api/v1/auth/sessao')).body).toEqual({ sso: false });
    });

    it('continua aceitando X-Perfil, sem exigir sessão', async () => {
      const resposta = await request(semLogin)
        .get('/api/v1/ge/resumo')
        .set('X-Perfil', 'PLATFORM_OPERATOR');

      expect(resposta.status).toBe(200);
    });
  });
});
