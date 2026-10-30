# Quickstart — como conferir

1. Subir o ambiente e abrir http://localhost:3000, Escala, Diagnóstico de uma loja com escala importada.
2. Em Configuração, definir três turnos (ex.: Manhã 08–14, Tarde 14–20, Noite 20–22) e dar mínimo 3 de Atendimento à tarde. Tentar turnos com buraco e ver o aviso.
3. Ver o quadro por turno: pessoas presentes × mínimo, com destaque onde falta; conferir a explicação que cita o turno.
4. Voltar a "sem turnos" e conferir que o Diagnóstico é o mesmo de antes (loja 001: selo em "Foco em economia", R$ 8.710).
5. Em Parâmetros legais (como dono), alterar a jornada da fase de 40h, ver o Diagnóstico recalcular e o histórico mostrar a versão antiga. Como gestor, ver sem poder editar.
6. Conferir o aviso de estimativa no topo dos cenários.
7. Rodar `npm test`, `npm run test:integration`, `npm run lint`, `npx tsc --noEmit` no `api` e o build do `web`.
