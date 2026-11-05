# Contratos: intervalo no Cadastro e fim da planilha de escala

**API do funcionário**: acrescenta `iniIntervalo` e `fimIntervalo` (`"HH:MM"`, opcionais, `null` para limpar). Erros em português (400): "Informe o início e o fim do intervalo (ou deixe os dois em branco)", "O fim do intervalo deve ser depois do início", "O intervalo deve ficar dentro do horário de trabalho", "Informe a entrada e a saída antes do intervalo".

**Planilha de funcionários**: colunas opcionais `inicio_intervalo` e `fim_intervalo`; as mesmas regras e mensagens, por linha; planilha sem as colunas continua válida.

**Removido**: `POST /cargas/escala` e `GET /planilha-modelo-escala` (e o modelo `modelo-escala-atual.xlsx`). Fica `POST /cargas/base` e o modelo da base comercial.

**Simulação**: `POST /lojas/:id/simulacoes` com `origem: "escala_atual"` passa a significar "equipe do Cadastro com horários". Sem nenhum funcionário com horário, devolve 400 com `code: "SEM_HORARIO_NO_CADASTRO"` e a mensagem "Cadastre o horário dos funcionários da loja antes de criar a simulação a partir da equipe."; a tela usa o código para cair em "vazia".

**Diagnóstico**: `numeros.linhasRejeitadas` continua na resposta como 0 e `fontes.escala` sai; os textos do estado sem horário orientam o Cadastro.

**Script de migração**: `npm run migrar-escala` (ensaio) e `npm run migrar-escala -- --aplicar` (grava); sai com relatório.
