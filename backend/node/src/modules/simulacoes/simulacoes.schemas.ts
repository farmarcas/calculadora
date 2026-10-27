import { z } from 'zod';

const vazio = z.object({}).strict();
const id = z.object({ id: z.string().uuid() }).strict();
const req = <B extends z.ZodType, P extends z.ZodType, Q extends z.ZodType = typeof vazio>(
  body: B,
  params: P,
  query?: Q,
) => z.object({ body, params, query: (query ?? vazio.default({})) as unknown as Q });

// Horas em decimal, de 15 em 15 minutos.
const hora = z
  .number()
  .min(0)
  .max(24)
  .refine((h) => Math.abs(h * 4 - Math.round(h * 4)) < 1e-9, {
    message: 'Use intervalos de 15 minutos',
  });

export const turnoSchema = z
  .object({
    matricula: z.string().min(1).max(30),
    dia: z.number().int().min(0).max(6),
    entrada: hora,
    saida: hora,
    iniIntervalo: hora.nullable(),
    fimIntervalo: hora.nullable(),
  })
  .strict();

export const REGRAS = ['atual', 'r42', 'r40'] as const;

export const porLojaReq = req(vazio.default({}), id);
export const listarReq = req(
  vazio.default({}),
  id,
  z.object({ descartadas: z.enum(['0', '1']).default('0') }).strict(),
);
export const porIdReq = req(vazio.default({}), id);
export const criarReq = req(
  z
    .object({
      nome: z.string().trim().min(2).max(80),
      regra: z.enum(REGRAS).default('r42'),
      // 'escala_atual' | 'vazia' | id de outra simulação da loja (clonar)
      origem: z
        .union([z.enum(['escala_atual', 'vazia']), z.string().uuid()])
        .default('escala_atual'),
    })
    .strict(),
  id,
);
export const editarReq = req(
  z
    .object({
      nome: z.string().trim().min(2).max(80).optional(),
      regra: z.enum(REGRAS).optional(),
      turnos: z.array(turnoSchema).max(500).optional(),
    })
    .strict()
    .refine((b) => Object.keys(b).length > 0, { message: 'Informe ao menos um campo' }),
  id,
);

export const aprovarReq = req(
  z
    .object({
      vigenciaInicio: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    })
    .strict()
    .default({}),
  id,
);
export const compararReq = req(
  vazio.default({}),
  id,
  z
    .object({
      ids: z
        .string()
        .transform((v) => v.split(',').filter(Boolean))
        .pipe(
          z
            .array(z.string().uuid())
            .min(2, 'Escolha de 2 a 3 simulações')
            .max(3, 'Escolha de 2 a 3 simulações'),
        ),
    })
    .strict(),
);
