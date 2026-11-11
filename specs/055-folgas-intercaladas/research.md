# Pesquisa: folgas mais intercaladas

- **Decision**: manter a cobertura como primeiro critério e inserir o afastamento depois dela. **Rationale**: prioridade escolhida; garante que as horas abaixo do mínimo nunca ficam piores que as de hoje. **Alternatives**: afastar antes da cobertura (abriria falta só por estética).
- **Decision**: distância circular até as outras folgas da pessoa, com teto de 3. **Rationale**: domingo e segunda são vizinhos; teto evita preferir sempre o dia mais distante possível. **Alternatives**: só proibir dias seguidos (não escolhe entre "separado por 1 dia" e "por 3").
- **Decision**: espalhar a equipe contando as folgas da função em cada dia (já existe, `junto`), agora logo depois do afastamento. **Rationale**: aproveita o que já existe.
- **Decision**: desempate rotativo `(dia − posição) mod 7`. **Rationale**: tira o viés de "sempre o menor dia" sem sorteio; é determinístico. **Alternatives**: sorteio com semente (mais difícil de testar e explicar).
- **Decision**: as folgas que a pessoa já tem (dias abertos sem turno no Cadastro) entram na distância. **Rationale**: o que importa é o descanso real da pessoa.
- **Decision**: duas implementações (servidor e tela) mantidas iguais com os mesmos testes. **Rationale**: é como a spec 042 já funciona; juntar as duas é outro trabalho.
- **Decision**: o servidor recebe `nome` opcional em `HorarioPessoa`. **Rationale**: o aviso precisa do nome; sem nome o aviso usa a função.
