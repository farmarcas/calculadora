import type { ConfigSso } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/logger.js';
import type { SessaoAtiva } from '../../shared/middlewares/sessao.js';
import { geRepository } from '../ge/ge.repository.js';
import { separarLojas } from './acesso.js';
import type { AuthRepository } from './auth.repository.js';
import { assinarSessao } from './jwt.js';
import { PERFIL_DE_QUEM_ENTRA, podeUsarEscala } from './papel.js';
import type { RadarClient } from './radar.client.js';

const semAcesso = () =>
  new AppError('Sua conta do Radar não tem acesso à calculadora.', 403, 'SEM_ACESSO');

export const corpoDaSessao = async (sessao: SessaoAtiva) => {
  const ids = sessao.operador ? undefined : sessao.grupos.map((g) => g.geId);
  const doGrupo = new Map(sessao.grupos.map((g) => [g.geId, g]));
  const grupos = await geRepository.listarAtivos(ids);
  return {
    sso: true,
    usuario: { nome: sessao.nome, email: sessao.email },
    operador: sessao.operador,
    grupos: grupos.map((g) => ({
      ...g,
      perfil: sessao.operador ? 'PLATFORM_OPERATOR' : doGrupo.get(g.id)?.perfil,
      acessoTotal: sessao.operador || Boolean(doGrupo.get(g.id)?.acessoTotal),
    })),
  };
};

export const makeAuthService = (radar: RadarClient, repo: AuthRepository, sso: ConfigSso) => ({
  async entrar(code: string) {
    const accessToken = await radar.trocarCodigo(code);
    const usuario = await radar.lerUsuario(accessToken);
    if (!podeUsarEscala(usuario)) throw semAcesso();

    const { aproveitaveis, ignoradas } = separarLojas(usuario.stores ?? []);
    if (ignoradas.length)
      logger.warn({ lojasDoRadar: ignoradas }, 'lojas do Radar sem grupo ou CNPJ válido');
    const grupos = await repo.sincronizarAcesso(aproveitaveis, PERFIL_DE_QUEM_ENTRA);
    if (!grupos.length) throw semAcesso();

    const sessao = await repo.abrirSessao({
      radarUsuarioId: usuario.id,
      nome: usuario.name,
      email: usuario.email,
      operador: false,
      grupos,
      expiraEm: new Date(Date.now() + sso.sessaoHoras * 60 * 60 * 1000),
    });
    return { sessao, token: await assinarSessao(sessao, sso.jwtSegredo) };
  },
});
