export const soDigitos = (s: string) => s.replace(/\D/g, '');

// ***.456.789-** : o CPF nunca sai por inteiro pela API.
export const mascararCpf = (cpf: string) => {
  const d = soDigitos(cpf).padStart(11, '0');
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
};

export const cpfComDigitosValidos = (cpf: string) => {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n: number) => {
    const soma = d
      .slice(0, n)
      .split('')
      .reduce((s, c, i) => s + Number(c) * (n + 1 - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
};

// Só para dados fictícios (testes e seed): gera um CPF com dígitos verificadores corretos.
export const gerarCpfFicticio = (semente: number) => {
  const base = String(100000000 + ((semente * 7919) % 899999999)).slice(0, 9);
  const dv = (d: string) => {
    const soma = d.split('').reduce((s, c, i) => s + Number(c) * (d.length + 1 - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(base);
  const d2 = dv(base + d1);
  return `${base}${d1}${d2}`;
};
