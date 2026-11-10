import { z } from 'zod';
import { descartarFuncoesFora, FUNCOES_NO_CALCULO } from '../cadastros/funcoes.js';

const vazio = z.object({}).strict();
const id = z.object({ id: z.string().uuid() }).strict();
const FUNCOES = FUNCOES_NO_CALCULO;

// Ajustes antigos de encargos por loja (RAT, FAP, rescisão). Não valem mais (o encargo é só o do regime), mas seguem
// aceitos no pedido e guardados no que já existe: nunca são lidos pelo cálculo nem alterados por uma gravação (`manterAjustesAntigos`).
export const ajustesEncargosSchema = z
  .object({
    ratPct: z.number().finite().optional(),
    fap: z.number().finite().optional(),
    rescisaoLigada: z.boolean().optional(),
  })
  .strict();

// O que fica gravado na loja. O encargo NÃO é um percentual digitado: vem do regime tributário (spec 015).
// `encargosPct` ainda é aceito por quem manda o formato antigo, mas é ignorado.
export const custosSchema = z
  .object({
    // Salário médio mensal por função (estimativa gerencial; nunca salário individual).
    salarioMedio: z.preprocess(
      descartarFuncoesFora,
      z.partialRecord(z.enum(FUNCOES), z.number().positive().max(1_000_000)),
    ),
    encargos: ajustesEncargosSchema.optional(),
    encargosPct: z.number().min(0).max(300).optional(),
  })
  .strict();
export type CustosGravados = z.infer<typeof custosSchema>;
// O que os cálculos usam: o salário médio e o encargo total já calculado a partir do regime da loja.
export type Custos = { salarioMedio: CustosGravados['salarioMedio']; encargosPct: number };

const req = <B extends z.ZodType>(body: B) =>
  z.object({ body, params: id, query: vazio.default({}) });
export const lerCustosReq = req(vazio.default({}));
export const salvarCustosReq = req(custosSchema);

// Grava os custos novos mantendo os ajustes antigos de encargos que já estavam guardados na loja; o que vier no pedido é ignorado.
export const manterAjustesAntigos = <T extends { encargos?: unknown }>(
  novo: T,
  atual: unknown,
): Omit<T, 'encargos'> & { encargos?: unknown } => {
  const { encargos: _ignorado, ...resto } = novo;
  void _ignorado;
  const guardado = (atual as { encargos?: unknown } | null | undefined)?.encargos;
  return guardado === undefined ? resto : { ...resto, encargos: guardado };
};
