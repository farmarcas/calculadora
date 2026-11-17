# Quickstart: validar os turnos sugeridos e o arrastar

Pré-requisito: uma loja com equipe com horário no Cadastro, custos e base comercial, e a Escala por hora (spec 039) já no ambiente.

## 1. Testes
`docker compose exec web npm test` (e `api`, que não muda).

## 2. Personalizar já com turnos
Abrir "Personalizar" num cenário que contrata: na Escala por hora, a contratação já tem turnos sobre as horas sem cobertura, e a faixa amarela mostra só o que sobrou.

## 3. Sugerir turno
Numa simulação com contratação sem turno: "Sugerir turno" coloca os turnos e a cobertura atualiza.

## 4. Prévia ao contratar
"+ Contratar": a barra tracejada aparece na grade; arrastar a barra muda Entra e Sai; Cancelar a apaga sem gravar.

## 5. Arrastar
Alças maiores e visíveis; o horário novo aparece na barra durante o gesto; clicar em "Folga" cria um turno; "Tirar do dia" o remove.

## 6. Erro e avisos
Provocar um erro de gravação: a mensagem aparece na seção e o turno volta. A faixa de contexto mostra o total da semana e os avisos da pessoa.

## 7. Perfis
Visualizador: sem "Sugerir turno", sem alças e sem "Folga" clicável. Gestor: edita, sem venda nem custo. Dono: vê o custo no formulário.
