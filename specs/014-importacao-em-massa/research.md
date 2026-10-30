# Pesquisa: importação em massa

## 1. Onde moram os dados novos
- **Decision**: gravar nas mesmas colunas da edição: `lojas.convencao_8h24`, `lojas.minimos` (JSON, mescla), `lojas.custos` (JSON, mescla) e `funcionarios.horario_fixo`.
- **Rationale**: a planilha tem de deixar a loja exatamente como a edição deixa (SC-003). Sem tabela nova, sem migration.
- **Alternatives**: chamar as rotas HTTP internamente (duplica validação e permissão) — descartado; guardar em coluna nova — desnecessário.

## 2. Permissão do dono sem abrir a criação de loja
- **Decision**: a confirmação decide por perfil linha a linha: dono atualiza só lojas existentes; loja nova e CNPJ/código ficam do operador; gestor ignora a aba Lojas com aviso.
- **Rationale**: respeita a regra "lojas vêm da plataforma" e dá ao dono o que ele precisa (atualizar 37 lojas de uma vez).
- **Alternatives**: negar tudo ao dono (não atende o pedido); deixar o dono criar loja (quebra a carga da plataforma).

## 3. Gestor
- **Decision**: ignorar a aba Lojas com aviso em vez de recusar a importação inteira.
- **Rationale**: o gestor continua importando a equipe, que é o uso dele hoje; recusar tudo perderia a planilha.

## 4. Custos parciais
- **Decision**: mesclar salário por função; `encargosPct` obrigatório (da planilha ou já gravado); sem encargos, não grava custo e avisa.
- **Rationale**: o esquema de custos exige o par; melhor avisar do que gravar pela metade.

## 5. Modelo com duas abas
- **Decision**: manter Lojas e Funcionários (mais a aba de ajuda); o pedido "duas abas" já está atendido, só faltavam colunas.
- **Rationale**: dividir em mais abas (por exemplo uma de "Configuração") deixaria o preenchimento mais longo sem ganho.

## 6. Ícone de upload
- **Decision**: SVG de traço no estilo Lucide dentro de `components/ui`.
- **Rationale**: o Alquimia indica Lucide para ícones que o conjunto dele não tem.
