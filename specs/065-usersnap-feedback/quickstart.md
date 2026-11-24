# Quickstart: validar o Usersnap

Pré-requisitos: ambiente no ar, chave do espaço no `.env` (`USERSNAP_SPACE_KEY=...`), um widget ativo no painel do Usersnap, login do Radar (ou pessoa de teste).

1. **Sem chave**: com `USERSNAP_SPACE_KEY` vazia, nenhum pedido ao Usersnap sai e nenhuma tela muda.
2. **Tela de entrada e demonstração**: com chave, nenhum pedido ao Usersnap antes do login.
3. **Logado**: o widget ativo no painel aparece; enviar um feedback; no Usersnap ele chega com a captura, o endereço da tela, nome, e-mail, perfil e loja.
4. **Troca de loja**: trocar de loja e enviar outro; o feedback mostra a loja nova.
5. **Sair**: o widget some e, ao entrar com outra pessoa, o feedback leva os dados dela.
6. **Bloqueio**: com o Usersnap bloqueado no navegador, o sistema funciona normalmente, sem erro visível.
7. **Limpeza**: apagar o feedback de teste no painel.
