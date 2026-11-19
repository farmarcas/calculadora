# Research: Editar o horário com minutos exatos

## O que o código faz hoje (verificado)

| Pergunta | Resposta | Onde |
| --- | --- | --- |
| O servidor aceita minuto quebrado? | Sim: "minutos inteiros" (15,4 é 15h24); recusa só fração de minuto. Testado pela API com 22:02. | `simulacoes.schemas.ts` (`hora`) |
| A tela arredonda ao gravar? | Não: `emQuarto` arredonda ao **minuto**, não ao quarto (nome e comentário enganam). | `escala-regras.js` (`turnosParaGravar`) |
| Onde os 15 minutos mandam? | Arrastar/teclado (`movimento-regras.js`) e o formulário de contratação (`opcoesDeHora`). | spec 039/047 |
| Como a cobertura trata minutos? | Conta a pessoa só nas horas **cheias** em que ela está; intervalo de até 2 h não tira da cobertura. Igual no servidor e na tela. | `presente` em `escala-regras.js` e `simulacoes/avaliar.ts` |
| Folha e horas da semana | Folha = carga contratada (não muda com minutos); `totalDaSemana` soma minutos reais. | `resultado.ts`, `escala-regras.js` |
| Visão do celular | Lista sem arrastar, mostra `textoDoTurno` (já com minutos); sem edição de horário. | `EscalaMobile.jsx` |

## Decisões

### D1 — Manter a cobertura por hora cheia
**Decision**: não mexer na conta da cobertura; a janela mostra "Cobre as horas de 08h a 16h" calculado pela mesma regra.
**Why**: mudar para fração de hora alteraria todos os resultados salvos e as duas cópias (servidor e tela). O horário exato fica guardado e visível.
**Alternatives**: contar fração de hora (descartada: muda tudo, exige mudar servidor e tela juntos); arredondar o que o usuário digita (descartada: perde o minuto, contra o pedido).

### D2 — Campos de horário nativos (`input type="time"`)
**Decision**: quatro campos `type="time"` com passo de 1 minuto.
**Why**: é o padrão já usado no Cadastro de turnos do projeto; dá teclado numérico no celular, devolve sempre "HH:mm" válido e é acessível. A conversão e a validação seguem em funções puras (aceitam também texto, para teste).
**Alternatives**: campo de texto com máscara (descartada: mais código e mais erro de digitação).

### D3 — A janela grava pelo caminho do arrastar
**Decision**: "Salvar" chama `mudarTurno(matricula, novo, true)` (o mesmo de soltar o mouse), com `antes` limpo.
**Why**: cobertura, avisos, resultado e o "ajustado" respondem igual; o horário digitado é a escolha da pessoa, então some o "ajustado".
**Verificado**: o servidor aceita; o teste de integração cobre.

### D4 — Uma janela só, aberta pela página da Escala por hora
**Decision**: o estado da janela mora em `EscalaPorHora` (computador e celular compartilham), que guarda o elemento do lápis para devolver o foco.
**Why**: evita duas cópias; o `Modal` já fecha com Esc e devolve o foco quando recebe o elemento.

### D5 — Validação por regras puras, mensagens fixas
**Decision**: `validarHorario` devolve um erro por campo, na ordem: preenchido/válido → saída depois da entrada → dentro do funcionamento → intervalo completo → intervalo dentro do turno → início antes do fim.
**Why**: mensagens em linguagem simples (as do spec) e testáveis sem tela.

### D6 — Sem mínimo de duração; sem bloqueio por jornada
**Decision**: só exige saída depois da entrada; jornada, teto e intervalo mínimo ficam como avisos da avaliação.
**Why**: é o pedido e é o comportamento do arrastar.

### D7 — Lápis no celular
**Decision**: um botão com ícone de lápis, 44 × 44 px, à direita do horário em cada linha com turno.
**Why**: a linha já tem espaço à direita; mesma janela. Em simulação somente leitura não aparece.

### D8 — Formato de exibição
**Decision**: manter "07h32–16h24" (função `textoDoTurno`) nas barras e textos; HH:mm só nos campos.
**Why**: é o formato do produto todo e já é exato.

## Resultado da implementação (19/11/2026)

- **T013 (exibição):** a barra (`textoDoTurno`, `aria-label`, `title`), a Escala da semana e a lista do celular já mostravam os minutos exatos ("14h37–22h", "intervalo 16h12–17h12"); não precisou mudar o texto, só ganhou teste (US3).
- **Servidor:** o teste de integração confirma que 07:32, 12:17, 13:17 e 16:24 voltam idênticos ao gravar e ao ler de novo; fração de minuto continua recusada.
- **Conferido na tela (Cosmópolis):** lápis na barra e na lista do celular (44 × 44 px), janela com erro em português ao lado do campo, Esc devolve o foco ao lápis, e o servidor guardou 14:37 / 16:12 / 17:12 / 22:00 sem "ajustado".
- **Detalhe de plataforma:** o campo de horário do navegador não digita "24:00"; para fechar à meia-noite a pessoa usa 23:59.
