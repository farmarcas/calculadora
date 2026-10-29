import { z } from 'zod';

const vazio = z.object({}).strict();
const id = z.object({ id: z.string().uuid() }).strict();
const req = <B extends z.ZodType, P extends z.ZodType>(body: B, params: P) =>
  z.object({ body, params, query: vazio.default({}) });

const nome = z.string().trim().min(2).max(120);
export const criarGeReq = req(
  z
    .object({
      nome,
      identificacao: z.string().trim().min(1).max(30),
      responsavel: z.string().trim().max(120).optional(),
    })
    .strict(),
  vazio.default({}),
);
export const editarGeReq = req(
  z
    .object({
      nome: nome.optional(),
      responsavel: z.string().trim().max(120).nullable().optional(),
      ativo: z.boolean().optional(),
    })
    .strict(),
  id,
);
