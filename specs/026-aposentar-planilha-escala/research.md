# Research: Aposentar a planilha de escala

**Decision**: o intervalo vira duas colunas no funcionário (`ini_intervalo`, `fim_intervalo`), em horas decimais, por migration.
**Rationale**: entrada e saída já são assim; a cobertura e a redistribuição já usam intervalo em horas decimais, então o Cadastro entrega no formato que elas esperam.
**Alternatives considered**: guardar o intervalo em texto (exigiria converter em cada uso); uma tabela à parte de intervalos (complexidade sem ganho, o intervalo é único por dia).

**Decision**: a migração de dados é um script separado, com ensaio por padrão, e não uma migration do Prisma.
**Rationale**: precisa de relatório, de decisão por matrícula e de não ser reaplicada às cegas na publicação; a migration do Prisma roda sozinha em toda publicação e esconderia o que mudou. Rodar com `--aplicar` é um passo consciente.
**Alternatives considered**: migration SQL automática (invisível e sem relatório); migrar na leitura, a cada diagnóstico (gravaria dado sem a pessoa saber).

**Decision**: a migração preenche só os campos vazios, por matrícula e loja, e nunca cria funcionário.
**Rationale**: preserva o que a pessoa digitou; pessoa da escala sem funcionário no Cadastro precisa de uma decisão humana (pode ser desligada, pode ser matrícula errada).
**Alternatives considered**: sobrescrever com a escala (perderia correção feita no Cadastro); criar funcionários automaticamente (poluiria o Cadastro).

**Decision**: `origem: escala_atual` continua no contrato da Simulação, com o novo sentido "equipe do Cadastro com horários".
**Rationale**: a tela e os testes enviam esse valor; mudar o nome agora aumenta a entrega sem ganho para quem usa. O texto ao usuário é o que muda.
**Alternatives considered**: renomear para `cadastro` (mexe em API, tela e testes sem necessidade).

**Decision**: o fallback da tela para "do zero" passa a usar um código de erro do servidor, não o texto da mensagem.
**Rationale**: hoje a tela procura a frase "Importe a escala atual"; trocar a frase quebraria o fallback em silêncio.
**Alternatives considered**: manter a frase antiga (desatualizada, que é justamente o aviso a corrigir).

**Decision**: as tabelas de escala importada ficam intactas.
**Rationale**: a constituição pede cuidado com dados; apagar pode vir depois, com a sua confirmação.
**Alternatives considered**: apagar junto (irreversível e fora do pedido).
