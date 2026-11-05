# Data Model: Novo cabeçalho e menu lateral (Radar)

Sem mudança no banco nem na API. Só estado da tela.

- **Preferência do menu** (`localStorage`, chave `menu:recolhido`): `"1"` recolhido, `"0"` aberto, ausente = padrão pela largura da tela (aberto a partir de 768 px). Qualquer erro de leitura ou escrita cai no padrão.
- **Item de menu**: `id`, `rotulo`, `icone`, `soOperador`, `filhos[]` (cada filho: `id`, `rotulo`, `tela`, `secao`, `soOperador`). Uma única lista descreve o menu inteiro.
- **Contexto atual** (estado de `App.jsx`): `perfil`, `ge`, `tela` (grupos | cadastros | escala), `secao` (lojas | parametros | diagnostico | grade), `lojas[]`, `lojaId`, `importando`.
- **Horas de funcionamento**: soma, nos dias abertos, de (fechamento − abertura) do `horarios` da loja (formato `{ versao: 2, dias[7] }` já devolvido por `/lojas`); sem horário válido, nada é mostrado.
