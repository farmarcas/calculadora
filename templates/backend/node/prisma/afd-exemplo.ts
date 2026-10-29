// Gera arquivos AFD FICTÍCIOS na pasta afd-exemplo/. Uso: npm run afd:exemplo
import { mkdirSync, writeFileSync } from 'node:fs';
import { gerarAfdsDeExemplo } from '../src/modules/ponto/exemplo.js';

mkdirSync('afd-exemplo', { recursive: true });
for (const a of gerarAfdsDeExemplo()) {
  writeFileSync(`afd-exemplo/${a.nome}`, a.conteudo, 'latin1');
  process.stdout.write(`afd-exemplo/${a.nome}\n`);
}
