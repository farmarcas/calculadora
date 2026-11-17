# Data Model: Intervalo de até 2 horas não precisa de cobertura

Nenhum dado novo nem mudança de banco.

- **Constante**: `LIMITE_INTERVALO_SEM_COBERTURA_H = 2` (servidor e tela).
- **Regra de presença**: a pessoa conta na hora `h` se o turno cobre a hora inteira e (não há intervalo que toque a hora **ou** o intervalo é de até 2 horas).
- **Entradas e saídas**: as mesmas; muda só o número de `pessoas` por hora e, em consequência, `ok`, faltas, `gapH` e contratações.
