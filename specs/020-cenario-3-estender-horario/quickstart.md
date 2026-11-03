# Quickstart — conferir o Cenário 3 com horário estendido

1. `docker compose up -d --build --wait` (ou `/subir-ambiente`).
2. Abrir Escala → Diagnóstico de uma loja cujo Cenário 1 contrata e deixa horas ociosas, como dono.
3. Conferir:
   - Se a extensão compensa: o Cenário 3 mostra "Sábado fecha 2 h mais tarde (de 08h–20h para 08h–22h)", a contratação, impacto melhor que o do Cenário 1 (positivo se a margem ganha passar da folha) e o aviso "Venda das horas novas é estimada".
   - Selo "Melhor resultado" quando o impacto é positivo; "Cenário sugerido" só se resistir à metade da venda estimada.
4. Lojas em que nada compensa: o Cenário 3 fica como antes (igual ao 1 ou ao 2, recolhido).
5. Gerente: vê a extensão e as horas, sem valores em R$.
6. Segunda a sexta nunca mudam; lojas 24 h não estendem.
7. Rodar os testes do servidor e do front.
