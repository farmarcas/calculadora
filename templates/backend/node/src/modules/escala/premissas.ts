import { z } from 'zod';

// Premissas do comparativo, só para simular: chegam no pedido do Diagnóstico e nunca são gravadas.
// Em porcentagem: recaptura, fator de dia novo e fator de hora nova. Dias protegidos e limite do parcial são contagens.
export type Premissas = {
  recaptura: number; // 0 a 30: parte da venda de um dia fechado que migra para os outros dias
  fatorDiaNovo: number; // 0 a 100: quanto da média dos dias abertos vale um dia hoje fechado
  fatorHoraNova: number; // 0 a 100: quanto da venda da hora vizinha vale uma hora nova ao estender o horário
  diasProtegidos: number; // 0 a 6: dias de maior faturamento que não se sugere fechar
  limiteParcial: number; // 0 a 3: turnos de sobra até os quais se contrata um parcial (0 desliga)
};

export const PREMISSAS_PADRAO: Premissas = {
  recaptura: 0,
  fatorDiaNovo: 50,
  fatorHoraNova: 50,
  diasProtegidos: 3,
  limiteParcial: 3,
};

const numero = (mensagem: string) => z.coerce.number(mensagem);

export const premissasQuery = z
  .object({
    recaptura: numero('A recaptura deve ser um número entre 0 e 30.')
      .min(0, 'A recaptura deve ficar entre 0% e 30%.')
      .max(30, 'A recaptura deve ficar entre 0% e 30%.')
      .optional(),
    fatorHoraNova: numero('O fator de hora nova deve ser um número entre 0 e 100.')
      .min(0, 'O fator de hora nova deve ficar entre 0% e 100%.')
      .max(100, 'O fator de hora nova deve ficar entre 0% e 100%.')
      .optional(),
    fatorDiaNovo: numero('O fator de dia novo deve ser um número entre 0 e 100.')
      .min(0, 'O fator de dia novo deve ficar entre 0% e 100%.')
      .max(100, 'O fator de dia novo deve ficar entre 0% e 100%.')
      .optional(),
    diasProtegidos: numero('Os dias protegidos devem ser um número de 0 a 6.')
      .int('Os dias protegidos devem ser um número inteiro de 0 a 6.')
      .min(0, 'Os dias protegidos devem ficar entre 0 e 6.')
      .max(6, 'Os dias protegidos devem ficar entre 0 e 6.')
      .optional(),
    limiteParcial: numero('O limite do contrato parcial deve ser um número de 0 a 3.')
      .int('O limite do contrato parcial deve ser um número inteiro de 0 a 3.')
      .min(0, 'O limite do contrato parcial deve ficar entre 0 e 3 turnos.')
      .max(3, 'O limite do contrato parcial deve ficar entre 0 e 3 turnos.')
      .optional(),
  })
  .strict();
export type PremissasEntrada = z.infer<typeof premissasQuery>;

// Junta o que veio no pedido com os padrões.
export const premissasDe = (q: PremissasEntrada | undefined) => ({
  valores: {
    recaptura: q?.recaptura ?? PREMISSAS_PADRAO.recaptura,
    fatorDiaNovo: q?.fatorDiaNovo ?? PREMISSAS_PADRAO.fatorDiaNovo,
    fatorHoraNova: q?.fatorHoraNova ?? PREMISSAS_PADRAO.fatorHoraNova,
    diasProtegidos: q?.diasProtegidos ?? PREMISSAS_PADRAO.diasProtegidos,
    limiteParcial: q?.limiteParcial ?? PREMISSAS_PADRAO.limiteParcial,
  } satisfies Premissas,
});
