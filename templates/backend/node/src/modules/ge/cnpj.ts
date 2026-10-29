import { soDigitos, validarCnpj } from '../cadastros/documentos.js';

export { validarCnpj };

// O CNPJ é guardado só com os 14 dígitos; aceita pontuação na entrada.
export const normalizarCnpj = (valor: string) => soDigitos(valor);

// 12.345.678/0001-90, para mostrar.
export const formatarCnpj = (valor: string) => {
  const d = soDigitos(valor);
  return d.length === 14
    ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
    : valor;
};
