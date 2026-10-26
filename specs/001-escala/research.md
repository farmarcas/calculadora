# Research — Escala

## Decisões

1. **Leitura de planilha**: `exceljs` (.xlsx lê e escreve, sem dependência nativa). CSV simples também aceito para a aba isolada. Alternativa descartada: SheetJS (distribuição npm sem manutenção e com avisos de segurança).
2. **Entender planilha fora do modelo**: heurística local, sem IA externa. Normaliza texto (sem acento, minúsculo), compara com sinônimos por campo (ex.: "Cod_Loja", "Código da filial", "Loja nº") e com similaridade de texto, e confere o conteúdo da coluna (CNPJ, horas "08:00", CPF, datas). Cada coluna recebe uma confiança; abaixo do limite fica "não entendi" e o gestor escolhe. Nada grava antes da confirmação. *Por quê*: dados de pessoas não devem sair da máquina (LGPD, D6); funciona offline e é testável.
3. **Regras 42h/40h**: motor em funções puras na API, com perfis versionados em tabela (atual CLT, EC 141 42h, EC 141 40h) e vigência. Valores vêm do documento M4 (teto semanal, 2 folgas, interjornada 11h, intervalo mínimo, farmacêutico em todo o horário); marcados "a validar juridicamente". Fonte única de cálculo = API; a tela chama o cálculo (debounce) ao arrastar turnos.
4. **Grade arrastável**: componente próprio com eventos de ponteiro (sem biblioteca pesada); granularidade de 15 min.
5. **Perfis e login**: sem login real nesta fase (lacuna conhecida do projeto). Seletor de perfil de demonstração (`TENANT_ADMIN`, `SCHEDULE_MANAGER`, `SCHEDULE_VIEWER`) enviado em cabeçalho; permissões aplicadas na API. Trocar por autenticação real é trabalho futuro.
6. **Um grupo só**: sem multi-tenant no banco agora; entidades ficam prontas para receber `grupoId` depois.
7. **Tela**: Tailwind com tokens do Alquimia DS (`handoff/tokens.css` do zip serão copiados para o front); layout fluido, sem `max-width` em páginas.
8. **Dados**: PK bigint nas tabelas; soft delete (`deletedAt`) em loja e funcionário; CPF guardado apenas se vier na planilha e apenas fictício; premissas de simulação em JSON congelado.
9. **Auditoria**: tabela única de eventos (ação, usuário/perfil, alvo, data).
10. **Exportações**: Excel via `exceljs`; impressão via folha de estilo de impressão do navegador. PDF fica para depois.

## Pontos em aberto técnicos resolvidos
Nenhum pendente. Catálogo trabalhista e limites de "desatualizada" dependem de decisões do negócio (M-D5, D8) — o plano usa valores padrão editáveis.
