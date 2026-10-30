# Quickstart: verificar a importação em massa

1. Ambiente de pé; tela em http://localhost:3000, papel **Dono do grupo**, GE 216.
2. Em **Cadastro de Loja** há um só botão de planilha: **Importar em massa** (ícone de upload).
3. Clique nele: o modal abre com **Baixar planilha modelo**. Baixe o arquivo: abas Lojas, Funcionários e Como preencher; a aba Lojas tem convenção, metas, salários e encargos; Funcionários tem Horário fixo.
4. Preencha uma loja existente (horário, margem, convenção, metas, salário e encargos) e um funcionário com Horário fixo = Sim. Envie, confira o que o sistema entendeu e confirme.
5. Abra a edição da loja: os mesmos valores aparecem em Dados, Faturamento, Horário, Funcionários e configuração (convenção, metas, custos) e o funcionário tem horário fixo.
6. Ponha na planilha um código de loja que não existe: a linha vira erro "Loja não cadastrada: só o operador cria lojas".
7. Troque para **Gestor de escala**: a aba Lojas é ignorada com aviso e a equipe importa normalmente.
8. Importe uma planilha **antiga** (sem as colunas novas): funciona e não apaga nada.
9. `npm test`, `npm run test:integration`, lint, tsc, build do `web`, `scripts/check-repo.sh`.
