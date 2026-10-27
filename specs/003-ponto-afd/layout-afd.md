# Layout do AFD (Portaria MTP 671/2021, Anexo V) — conferido

Fonte: [Leiaute do Arquivo Fonte de Dados (AFD), gov.br/Trabalho e Emprego](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/fiscalizacao-do-trabalho/leiaute-do-arquivo-fonte-de-dados-afd.pdf) (conferido em 2026-10-27 a partir do texto do próprio PDF).

## Regras gerais
- Texto ASCII ISO 8859-1, **largura fixa**, uma linha por registro, terminada em CR LF (13 e 10). Registros ordenados por NSR. Sem linhas em branco.
- Campos preenchidos pela esquerda; posições sobrando com espaço.
- Data (D): `AAAA-MM-dd`. Data e hora (DH, 24 caracteres): `AAAA-MM-ddThh:mm:00ZZZZZ`, fuso `+hhmm`/`-hhmm` (ex.: `2021-04-27T16:44:00-0300`).
- **CRC-16** nos registros tipos 1 a 5, com o padrão **CRC-16/KERMIT** (CCITT-TRUE): polinômio 0x1021 refletido, valor inicial 0, sem xor final. Exemplo oficial: `"123456789"` → `0x2189`. Gravado como 4 caracteres hexadecimais (`2189`, sem `0x`) no último campo do registro.
- Tipo 7 usa **SHA-256** (64 caracteres hexadecimais) no campo 8, e não tem CRC.

## Registros que o sistema usa
| Tipo | Conteúdo | Campos (posição, tamanho) |
|---|---|---|
| **1** Cabeçalho (302) | identifica o arquivo | NSR `000000000` (1–9) · tipo `1` (10) · tipo de identificador do empregador `1`=CNPJ `2`=CPF (11) · **CNPJ/CPF do empregador** (12–25, 14) · CNO/CAEPF (26–39) · razão social (40–189) · nº fabricação / processo / INPI (190–206) · **data inicial** (207–216) · **data final** (217–226) · data/hora de geração (227–250) · **versão do leiaute `004`** (251–253) · tipo ident. fabricante (254) · CNPJ/CPF fabricante (255–268) · modelo (269–298) · **CRC-16** (299–302) |
| **3** Marcação REP-C e REP-A (50) | batida | NSR (1–9) · tipo `3` (10) · **data e hora da marcação** DH (11–34) · **CPF do empregado** (35–46, 12) · **CRC-16** (47–50) |
| **7** Marcação REP-P (137) | batida | NSR (1–9) · tipo `7` · **data e hora da marcação** (11–34) · **CPF** (35–46) · data e hora de gravação (47–70) · coletor `01` mobile, `02` browser, `03` desktop, `04` dispositivo, `05` outro (71–72) · `0` on-line / `1` off-line (73) · **hash SHA-256** (74–137) |
| **9** Trailer (64) | totais | `999999999` (1–9) · quantidade de registros tipo 2 (10–18), 3 (19–27), 4 (28–36), 5 (37–45), 6 (46–54), 7 (55–63) · tipo `9` (64) |

Outros tipos (lidos só para conferir CRC e contar, sem uso na apuração): **2** inclusão/alteração da empresa no REP (331, CRC 328–331) · **4** ajuste do relógio (73, CRC 70–73) · **5** inclusão/alteração/exclusão de empregado no REP (118, CRC 115–118) · **6** eventos sensíveis do REP (sem CRC; NSR, tipo, DH, evento de 2 dígitos).
Depois do trailer vem a **assinatura digital**: 100 caracteres; em REP-A e REP-P é o texto `ASSINATURA_DIGITAL_EM_ARQUIVO_P7S` completado com espaços. O sistema aceita e ignora esse bloco final.

## Decisões de leitura
1. O CRC é calculado sobre os caracteres do registro **antes** do campo de CRC. Falha de CRC (tipos 1 a 5) rejeita o arquivo inteiro.
2. O trailer é conferido: as quantidades por tipo precisam bater com o que foi lido. Arquivo cortado ou com linha a mais/menos é rejeitado.
3. Hash do tipo 7: confere só o formato (64 hexadecimais). A fórmula completa de concatenação não está inequívoca no anexo, então o sistema não rejeita por hash e registra o aviso "hash não verificado".
4. Data e hora: vale o que está escrito (horário local do REP); o fuso é lido mas a apuração usa o horário de parede.
5. CPF: 11 dígitos; o campo tem 12 posições, então aceita espaço ou zero extra e normaliza para 11 dígitos.
6. Layout antigo da Portaria 1510 (por PIS) está **fora** (documento M-D6).
