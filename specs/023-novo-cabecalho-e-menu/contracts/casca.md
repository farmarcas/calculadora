# Contrato da casca

**Props que a casca entrega às telas**
- `EscalaPage`: `perfil`, `lojaId`, `secao` (`"diagnostico"` | `"grade"`), `versaoDados` (número que sobe após uma importação, para recarregar), `onImportar()`, `onIrCadastros()`.
- `CadastrosPage`: `perfil`, `secao` (`"lojas"` | `"parametros"`).
- `GruposPage`: sem mudança.

**O que a casca guarda e as telas deixam de guardar**: lista de lojas, loja escolhida, aba (seção) e modal de envio de planilhas da Escala.

**Acessibilidade (obrigatório)**
- `header` (barra), `nav` com `aria-label="Menu principal"`, `main`.
- Botão do menu: nome "Recolher menu" ou "Expandir menu", `aria-expanded`, `aria-controls` do menu.
- Item atual: `aria-current="page"`. Menu recolhido: cada item com `aria-label` e dica no mouse e no foco.
- Menu da conta: abre pelo avatar (`aria-haspopup`, `aria-expanded`), fecha com Esc e clique fora, devolve o foco ao avatar.
- Importar: `aria-label="Importar planilhas"`.

**Medidas (do desenho)**: barra 80 px; menu 280 px aberto e 72 px recolhido; item 56 px; faixa 64 px; filtro de Loja 280 px; menu da conta 320 px; logo 28 px de altura; transição do menu 150–200 ms.
