import { z } from 'zod';

const vazio = z.object({}).strict();
const id = z.object({ id: z.string().uuid() }).strict();
export const logReq = z.object({
  body: vazio.default({}),
  params: id,
  query: z.object({ page: z.coerce.number().int().positive().default(1) }).strict(),
});

const req = <B extends z.ZodType, P extends z.ZodType>(body: B, params: P) =>
  z.object({ body, params, query: vazio.default({}) });
const idEBatida = z.object({ id: z.string().uuid(), batidaId: z.string().uuid() }).strict();

export const pendenciasReq = z.object({
  body: vazio.default({}),
  params: id,
  query: z
    .object({
      motivo: z.enum(['cpf_desconhecido', 'sem_lotacao', 'dia_sem_escala']).optional(),
      page: z.coerce.number().int().positive().default(1),
    })
    .strict(),
});
export const vincularReq = req(
  z.object({ matricula: z.string().min(1).max(30) }).strict(),
  idEBatida,
);
export const ignorarReq = req(
  z.object({ motivo: z.string().trim().min(3, 'Informe o motivo').max(200) }).strict(),
  idEBatida,
);
export const folgaReq = req(vazio.default({}), idEBatida);
export const cpfReq = req(
  z.object({ cpf: z.string().min(11).max(14), matricula: z.string().min(1).max(30) }).strict(),
  id,
);

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use AAAA-MM-DD');
export const apuracaoReq = z.object({
  body: vazio.default({}),
  params: id,
  query: z.object({ de: dataIso.optional(), ate: dataIso.optional() }).strict(),
});
