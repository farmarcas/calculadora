import { z } from 'zod';
import { premissasQuery } from './premissas.js';

const vazio = z.object({}).strict();
const id = z.object({ id: z.string().uuid() }).strict();
const req = <B extends z.ZodType, P extends z.ZodType>(body: B, params: P) =>
  z.object({ body, params, query: vazio.default({}) });

export const porLojaReq = req(vazio.default({}), id);
// O Diagnóstico aceita premissas opcionais, só para simular (nada é gravado).
export const diagnosticoReq = z.object({
  body: vazio.default({}),
  params: id,
  query: premissasQuery.default({}),
});
const hora = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, 'Horário inválido (use HH:MM)');
const turnoSchema = z
  .object({
    nome: z.string().trim().min(1).max(30),
    inicio: hora,
    fim: hora,
    minimos: z.partialRecord(
      z.enum(['Farmacêutico', 'Atendimento', 'Caixa', 'Apoio', 'Perfumaria']),
      z.number().int().min(0).max(10),
    ),
  })
  .strict();

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
      // Lista de turnos (a validação contra o horário da loja é no serviço) ou nulo para voltar ao mínimo único.
      turnos: z.array(turnoSchema).max(6).nullable().optional(),
    })
    .strict()
    .refine((b) => Object.keys(b).length > 0, { message: 'Informe ao menos um campo' })
    .refine((b) => (b.minimos?.['Farmacêutico'] ?? 1) >= 1, {
      message: 'Farmacêutico: mínimo de 1 em todo o horário (Lei 13.021/2014)',
    }),
  id,
);
