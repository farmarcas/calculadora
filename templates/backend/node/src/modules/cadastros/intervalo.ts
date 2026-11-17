import { horaParaDecimal } from './carga.js';

// Regras do intervalo do funcionário (spec 026), iguais na planilha e na tela: os dois informados ou nenhum; o fim depois do
// início; os dois dentro do turno (entrada ≤ início e fim ≤ saída); e sem entrada e saída não há intervalo.
// Devolve a mensagem em português do primeiro erro, ou nulo quando está tudo certo.
export const validarIntervalo = (a: {
  entrada?: string | null;
  saida?: string | null;
  ini?: string | null;
  fim?: string | null;
}): string | null => {
  const temIni = !!a.ini;
  const temFim = !!a.fim;
  if (!temIni && !temFim) return null;
  if (temIni !== temFim)
    return 'Informe o início e o fim do intervalo (ou deixe os dois em branco)';
  if (!a.entrada || !a.saida) return 'Informe a entrada e a saída antes do intervalo';
  const ini = horaParaDecimal(a.ini!);
  const fim = horaParaDecimal(a.fim!);
  if (fim <= ini + 1e-9) return 'O fim do intervalo deve ser depois do início';
  if (ini < horaParaDecimal(a.entrada) - 1e-9 || fim > horaParaDecimal(a.saida) + 1e-9)
    return 'O intervalo deve ficar dentro do horário de trabalho';
  return null;
};
