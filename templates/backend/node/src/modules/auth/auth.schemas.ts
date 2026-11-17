import { z } from 'zod';

const vazio = z.object({}).strict();

export const exchangeReq = z.object({
  body: z.object({ code: z.string().trim().min(1).max(256) }).strict(),
  params: vazio.default({}),
  query: vazio.default({}),
});
