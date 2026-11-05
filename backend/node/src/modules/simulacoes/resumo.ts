// Resumo de uma simulação para a lista e a comparação: o tipo do cenário e o nome legível de quem a criou.

export type TipoDoCenario = 'mantem' | 'reduz' | 'amplia';

// Compara as horas abertas por semana da simulação com as da loja: mais horas amplia, menos reduz, igual mantém.
export const tipoDoCenario = (horasAbertas: number, horasAbertasAntes: number): TipoDoCenario => {
  const d = Math.round((horasAbertas - horasAbertasAntes) * 100) / 100;
  return d > 0 ? 'amplia' : d < 0 ? 'reduz' : 'mantem';
};

// O sistema ainda não tem o nome da pessoa (login com nome virá depois): mostra o papel, em linguagem legível,
// e nunca o código interno do perfil.
const NOMES_DE_QUEM_CRIOU: Record<string, string> = {
  TENANT_ADMIN: 'Administrador da conta',
  SCHEDULE_MANAGER: 'Gestor de escala',
  SCHEDULE_VIEWER: 'Consulta',
  PLATFORM_OPERATOR: 'Administrador da plataforma',
};
export const nomeDeQuemCriou = (autor: string | null | undefined): string =>
  (autor && NOMES_DE_QUEM_CRIOU[autor]) || 'Sistema';
