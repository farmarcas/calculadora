import { z } from 'zod';

const vazio = z.object({}).strict();
const id = z.object({ id: z.string().uuid() }).strict();
const FUNCOES = ['Farmacêutico', 'Atendimento', 'Caixa', 'Apoio', 'Perfumaria'] as const;

// Ajustes de encargos de UMA loja: só o que ela mudou do padrão do regime (RAT de 1% a 3%, FAP de 0,5 a 2,0, rescisão).
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
    salarioMedio: z.partialRecord(z.enum(FUNCOES), z.number().positive().max(1_000_000)),
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
