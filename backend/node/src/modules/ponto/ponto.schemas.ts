import { z } from 'zod';

const vazio = z.object({}).strict();
const id = z.object({ id: z.string().uuid() }).strict();
export const logReq = z.object({
  body: vazio.default({}),
  params: id,
  query: z.object({ page: z.coerce.number().int().positive().default(1) }).strict(),
});
