import { z } from 'zod';

const vazio = z.object({}).strict();
const id = z.object({ id: z.string().uuid() }).strict();
const hora = z.string().regex(/^\d{2}:\d{2}$/);
const horario = z.object({ abre: hora, fecha: hora }).strict();

export const FUNCOES = ['Farmacêutico', 'Atendimento', 'Caixa', 'Apoio', 'Perfumaria'] as const;

export const lojaSchema = z
  .object({
    codigo: z.string().trim().min(1).max(30),
    nome: z.string().trim().min(2).max(120),
    cnpj: z.string().trim().max(18).optional(),
    uf: z.string().trim().length(2).optional(),
    marca: z.string().trim().max(80).optional(),
    horarios: z
      .object({
        semana: horario.optional(),
        sabado: horario.optional(),
        domingo: horario.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type LojaBody = z.infer<typeof lojaSchema>;

export const funcionarioSchema = z
  .object({
    matricula: z.string().trim().min(1).max(30),
    nome: z.string().trim().min(2).max(120),
    lojaId: z.string().uuid(),
    cpf: z.string().trim().max(14).optional(),
    cargo: z.string().trim().max(80).optional(),
    funcaoEscala: z.enum(FUNCOES).nullable().optional(),
    cargaSemanalH: z.number().int().min(1).max(60).optional(),
    regime: z.string().trim().max(30).optional(),
  })
  .strict();
export type FuncionarioBody = z.infer<typeof funcionarioSchema>;

const paginacao = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    busca: z.string().trim().optional(),
    lojaId: z.string().uuid().optional(),
  })
  .strict();

const req = <B extends z.ZodType, P extends z.ZodType, Q extends z.ZodType>(
  body: B,
  params: P,
  query: Q,
) => z.object({ body, params, query });

export const listarReq = req(vazio.default({}), vazio.default({}), paginacao);
export const criarLojaReq = req(lojaSchema, vazio.default({}), vazio.default({}));
export const editarLojaReq = req(lojaSchema.partial(), id, vazio.default({}));
export const criarFuncReq = req(funcionarioSchema, vazio.default({}), vazio.default({}));
export const editarFuncReq = req(funcionarioSchema.partial(), id, vazio.default({}));
export const porIdReq = req(vazio.default({}), id, vazio.default({}));
export const confirmarReq = req(
  z
    .object({
      mapeamento: z
        .object({
          lojas: z
            .object({
              aba: z.string(),
              colunas: z.record(z.string(), z.number().int().min(0).nullable()),
            })
            .nullable(),
          funcionarios: z
            .object({
              aba: z.string(),
              colunas: z.record(z.string(), z.number().int().min(0).nullable()),
            })
            .nullable(),
        })
        .strict(),
    })
    .strict(),
  id,
  vazio.default({}),
);
export const semDados = req(vazio.default({}), vazio.default({}), vazio.default({}));
