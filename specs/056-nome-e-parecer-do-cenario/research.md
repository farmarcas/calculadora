# Pesquisa: nome e parecer do cenário salvo

- **Decision**: guardar o parecer pronto (retrato) em duas versões (`dono` e `publico`) e entregar a do perfil. **Rationale**: o parecer registra uma decisão e não deve mudar com o Cadastro; a versão completa não sai para quem não é dono. **Alternatives**: gerar sempre na hora (mudaria com o Cadastro e com a base de vendas); guardar só os números e montar o texto ao ler (mais frágil e fica difícil provar que o retrato não mudou).
- **Decision**: duas colunas novas (`observacao`, `parecer`) em `simulacoes`. **Rationale**: simples, aditivo e sem risco para os dados atuais. **Alternatives**: guardar dentro de `premissas` (mistura coisas diferentes e dificulta consultar).
- **Decision**: PDF no servidor com `pdfkit`. **Rationale**: mesmo conteúdo da tela, sem depender do navegador, quebra de linha e páginas prontas, fonte Helvetica com acentos do português. **Alternatives**: imprimir pelo navegador (não baixa arquivo e o layout varia); gerar PDF na tela com biblioteca de captura (imagem, não texto); navegador sem cabeça (pesado demais).
- **Decision**: no PDF, "−" vira "-" e as setas viram "para". **Rationale**: a fonte padrão do PDF não tem esses símbolos.
- **Decision**: nome único por loja, sem diferenciar maiúsculas, olhando os cenários não descartados. **Rationale**: evita confundir cenários nas listas sem travar quem descartou um nome.
- **Decision**: cenário antigo recebe o parecer montado ao abrir (`montadoAgora: true`), sem observação. **Rationale**: ninguém perde acesso ao que já salvou.
- **Decision**: "Ver parecer" na lista e na comparação de salvos. **Rationale**: é onde a pessoa já olha os cenários salvos.
