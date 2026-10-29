# Modelo de dados — horário por dia

Sem migration: `lojas.horarios` (JSON) muda de formato, com leitura dos dois.

```json
{
  "versao": 2,
  "dias": [
    { "aberta": true,  "h24": false, "abre": "08:00", "fecha": "22:00" },   // segunda
    { "aberta": true,  "h24": false, "abre": "08:00", "fecha": "22:00" },   // terça
    { "aberta": true,  "h24": false, "abre": "08:00", "fecha": "22:00" },   // quarta
    { "aberta": true,  "h24": false, "abre": "08:00", "fecha": "22:00" },   // quinta
    { "aberta": true,  "h24": false, "abre": "08:00", "fecha": "22:00" },   // sexta
    { "aberta": true,  "h24": false, "abre": "08:00", "fecha": "20:00" },   // sábado
    { "aberta": false }                                                      // domingo
  ]
}
```
Loja 24 horas: sete dias com `{ "aberta": true, "h24": true, "abre": "00:00", "fecha": "24:00" }`.

**Formato antigo aceito na leitura e na API**: `{ "semana": {abre, fecha}, "sabado": {…}, "domingo": {…} }` → segunda a sexta recebem `semana`; o que faltar vira fechado.

**Regras**: sempre 7 dias; aberta sem 24h exige `abre < fecha` em HH:MM (fecha pode ser `24:00`); `h24` implica `00:00`–`24:00`; fechado não guarda horário. Simulação gravada mantém em `premissas.horarios` o formato com que foi gravada (lido pelo mesmo conversor).
