// CRC-16/KERMIT (CCITT-TRUE), o padrão exigido pelo AFD: polinômio 0x1021 refletido (0x8408), início 0.
// Valor de referência do anexo oficial: "123456789" → 0x2189.
export const crc16Kermit = (texto: string): string => {
  let crc = 0;
  for (const byte of Buffer.from(texto, 'latin1')) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0x8408 : crc >>> 1;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};
