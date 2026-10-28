import { z } from 'zod';

const vazio = z.object({}).strict();
const id = z.object({ id: z.string().uuid() }).strict();
const FUNCOES = ['Farmacêutico', 'Atendimento', 'Caixa', 'Apoio', 'Perfumaria'] as const;

export const custosSchema = z
  .object({
    // Salário médio mensal por função (estimativa gerencial; nunca salário individual).
    salarioMedio: z.partialRecord(z.enum(FUNCOES), z.number().positive().max(1_000_000)),
    encargosPct: z.number().min(0).max(300),
  })
  .strict();
export type Custos = z.infer<typeof custosSchema>;

const req = <B extends z.ZodType>(body: B) =>
  z.object({ body, params: id, query: vazio.default({}) });
export const lerCustosReq = req(vazio.default({}));
export const salvarCustosReq = req(custosSchema);
