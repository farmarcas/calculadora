import { z } from 'zod';

const vazio = z.object({}).strict();
const id = z.object({ id: z.string().uuid() }).strict();
const req = <B extends z.ZodType, P extends z.ZodType>(body: B, params: P) =>
  z.object({ body, params, query: vazio.default({}) });

export const porLojaReq = req(vazio.default({}), id);
export const configuracaoReq = req(
  z
    .object({
      convencao8h24: z.boolean().optional(),
      minimos: z
        .partialRecord(
          z.enum(['Farmacêutico', 'Atendimento', 'Caixa', 'Apoio', 'Perfumaria']),
          z.number().int().min(0).max(10),
        )
        .optional(),
    })
    .strict()
    .refine((b) => Object.keys(b).length > 0, { message: 'Informe ao menos um campo' })
    .refine((b) => (b.minimos?.['Farmacêutico'] ?? 1) >= 1, {
      message: 'Farmacêutico: mínimo de 1 em todo o horário (Lei 13.021/2014)',
    }),
  id,
);
