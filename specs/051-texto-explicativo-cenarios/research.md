# Pesquisa: texto explicativo por cenário

- **Decision**: montar a frase no servidor, por perfil. **Rationale**: o servidor já sabe o perfil e é a única fonte dos pesos e reais; evita que a tela precise de dados de custo para gestor e consulta. **Alternatives**: montar na tela com os campos da linha (exigiria enviar reais e pesos a quem não pode vê-los, ou frases diferentes por perfil na tela).
- **Decision**: trechos `{ texto, negrito }`. **Rationale**: negrito preto sem HTML e sem interpretar texto. **Alternatives**: marcação `**…**` (frágil) ou HTML (risco desnecessário).
- **Decision**: "caminho recomendado" só quando Manter cobre tudo. **Rationale**: o selo de cenário sugerido saiu; a frase não pode recomendar o que não resolve.
- **Decision**: a frase usa `custoPctFaturamento` (os mesmos pesos da coluna) e `custoSentido`. **Rationale**: números idênticos aos da coluna, sem segunda conta.
- **Decision**: falta de várias funções cita a de mais horas e agrupa o resto. **Rationale**: texto curto.
