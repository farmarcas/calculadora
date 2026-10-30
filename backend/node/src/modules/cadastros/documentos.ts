export const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export const soDigitos = (v: string) => v.replace(/\D/g, '');

// Dígito verificador: soma ponderada dos dígitos anteriores, módulo 11.
const digito = (base: string, pesos: number[]) => {
  const soma = [...base].reduce((s, c, i) => s + Number(c) * pesos[i]!, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
};

export const validarCnpj = (valor: string) => {
  const d = soDigitos(valor);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const p2 = [6, ...p1];
  const d1 = digito(d.slice(0, 12), p1);
  return d1 === Number(d[12]) && digito(d.slice(0, 13), p2) === Number(d[13]);
};

export const validarCpf = (valor: string) => {
  const d = soDigitos(valor);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const p1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const p2 = [11, ...p1];
  return digito(d.slice(0, 9), p1) === Number(d[9]) && digito(d.slice(0, 10), p2) === Number(d[10]);
};

// Só os três dígitos do meio ficam visíveis: ***.123.456-**
export const mascararCpf = (cpf: string | null | undefined) => {
  if (!cpf) return cpf ?? undefined;
  const d = soDigitos(cpf);
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : '***';
};
