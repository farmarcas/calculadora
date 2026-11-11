# Como conferir

1. Subir o ambiente (a migração nova é aplicada) e abrir uma simulação em Cosmópolis ("Analisar" → Manter horários), como dono.
2. Clicar em **Salvar como cenário N**: abre a janela com o nome "Cenário N" e a observação. Apagar o nome e confirmar: avisa "Dê um nome ao cenário". Digitar "Plano reforço" e uma observação; confirmar.
3. Abrir a lista de cenários salvos: o cenário aparece como "Plano reforço". Repetir o nome (também "plano REFORÇO"): a janela avisa que já existe.
4. Clicar em **Ver parecer**: título, loja, regra, data e quem salvou, resumo, decisões (1 farmacêutico, horário igual ao do Cadastro, nenhum desligamento), efeitos (folha de 8,0% para 9,7%, R$ 7.659 por mês, venda, cobertura) e a observação separada, com a frase final de estimativa.
5. Clicar em **Baixar parecer em PDF**: o arquivo tem o mesmo conteúdo, com os acentos certos.
6. Como gestor e como consulta: o parecer e o PDF não têm "R$" nem percentual de custo; só "a folha aumenta".
7. Abrir um cenário salvo antes desta mudança: o parecer abre, sem observação, com o aviso de que foi montado agora.
8. Alterar o Cadastro e reabrir o parecer: ele continua igual ao do momento de salvar.
9. Testes: `docker compose exec -T api npx vitest run`, `… api npm run test:integration` (sozinho) e `… web npx vitest run`.
