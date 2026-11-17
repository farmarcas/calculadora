# Pesquisa: desligar pessoa na simulação

- **Decision**: usar o campo `desligados` do salvamento que já existe. **Rationale**: o servidor recalcula tudo, bloqueia simulação gravada e audita; os turnos de quem sai continuam guardados, então religar é só tirar o nome da lista. **Alternatives**: rota nova de desligar e religar (duplicaria validação e auditoria).
- **Decision**: a lista enviada é sempre a completa. **Rationale**: o servidor trata `desligados` como o estado inteiro, não como um incremento. **Alternatives**: enviar só a mudança (o servidor não entende).
- **Decision**: "Desligar" só em funcionário existente; vaga continua com "Remover". **Rationale**: o servidor recusa desligar vaga ("remova a vaga em vez de desligar"); o botão nem aparece.
- **Decision**: a faixa aparece uma vez, acima das visões, e é só leitura quando não se pode editar. **Rationale**: evita repetir e mantém a informação para quem só lê.
- **Decision**: o card de resultado (spec 052) não muda. **Rationale**: ele já conta "hoje" com o quadro inteiro e mostra a folha que cai.
