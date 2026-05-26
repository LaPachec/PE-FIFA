# Regras de negocio

## Campeonatos

Um campeonato pertence a um usuario dono e pode estar em um dos seguintes status:

- `DRAFT`
- `IN_PROGRESS`
- `KNOCKOUT_STAGE`
- `FINISHED`

Os formatos planejados sao:

- `LEAGUE`
- `KNOCKOUT`
- `LEAGUE_KNOCKOUT`

## Autenticacao

Usuarios reais acessam rotas privadas usando token JWT.

Regras:

1. Cadastro exige `name`, `email` e `password`.
2. `email` precisa ser unico.
3. `password` precisa ter no minimo 6 caracteres.
4. Senhas nunca sao retornadas pela API.
5. Senhas sao armazenadas como hash.
6. Login retorna `401` quando as credenciais sao invalidas.
7. Rotas privadas exigem header `Authorization: Bearer <token>`.
8. O token contem `userId` e e assinado com `JWT_SECRET`.
9. `/auth/me` retorna apenas dados basicos do usuario autenticado.

## Ownership de campeonatos

Campeonatos pertencem ao usuario autenticado que os criou.

Regras:

1. Ao criar campeonato, `ownerId` recebe o ID do usuario autenticado.
2. A listagem privada mostra apenas campeonatos do usuario autenticado.
3. Buscar, editar, remover, iniciar, finalizar ou gerar mata-mata exige que o campeonato pertenca ao usuario autenticado.
4. Rotas publicas por `slug` continuam sem autenticacao.
5. Dados sensiveis do usuario dono nao devem ser expostos em endpoints publicos.

## Participantes

Um participante pertence a um campeonato e pode representar um jogador, apelido e time usado no FIFA/EA FC.

Status planejados:

- `ACTIVE`
- `ELIMINATED`
- `CHAMPION`

## Partidas

Uma partida pertence a um campeonato e pode fazer parte da liga ou de uma fase eliminatoria.

Fases planejadas:

- `LEAGUE`
- `ROUND_OF_16`
- `QUARTER_FINAL`
- `SEMI_FINAL`
- `THIRD_PLACE`
- `FINAL`

## Inicio de campeonatos de liga

Campeonatos com formato `LEAGUE` podem ser iniciados automaticamente gerando partidas de liga.

Regras:

1. O campeonato precisa existir.
2. O campeonato precisa estar com status `DRAFT`.
3. O campeonato precisa ter pelo menos 3 participantes.
4. Ao iniciar, o sistema gera partidas para todos os pares de participantes.
5. Se `isTwoLegged` for `true`, o sistema gera tambem a partida inversa de cada confronto.
6. Todas as partidas geradas usam `phase = LEAGUE` e `status = PENDING`.
7. A geracao das partidas e a troca de status para `IN_PROGRESS` acontecem na mesma transaction.
8. O campeonato nao pode ser iniciado duas vezes.

## Inicio de campeonatos liga + mata-mata

Campeonatos com formato `LEAGUE_KNOCKOUT` iniciam pelo mesmo fluxo da liga, gerando apenas partidas da fase `LEAGUE` neste MVP.

Regras:

1. O campeonato precisa existir.
2. O campeonato precisa estar com status `DRAFT`.
3. O campeonato precisa ter pelo menos 3 participantes.
4. `qualifiedCount` e obrigatorio.
5. `qualifiedCount` deve ser `2`, `4`, `8` ou `16`.
6. `qualifiedCount` nao pode ser maior que o numero de participantes.
7. Ao iniciar, o sistema gera partidas para todos os pares de participantes.
8. Se `isTwoLegged` for `true`, o sistema gera tambem a partida inversa de cada confronto.
9. Todas as partidas geradas usam `phase = LEAGUE` e `status = PENDING`.
10. A fase mata-mata nao e gerada nesta etapa.
11. A geracao das partidas e a troca de status para `IN_PROGRESS` acontecem na mesma transaction.
12. O campeonato nao pode ser iniciado duas vezes.

## Geracao da fase mata-mata em liga + mata-mata

Campeonatos `LEAGUE_KNOCKOUT` geram a fase final apenas depois que a fase de liga termina.

Regras:

1. O campeonato precisa existir.
2. O campeonato precisa ser do formato `LEAGUE_KNOCKOUT`.
3. O campeonato precisa estar com status `IN_PROGRESS`.
4. Todas as partidas da fase `LEAGUE` precisam estar com status `FINISHED`.
5. `qualifiedCount` precisa estar configurado como `2`, `4`, `8` ou `16`.
6. `qualifiedCount` nao pode ser maior que o numero de participantes.
7. A classificacao da liga define os classificados.
8. O sistema seleciona os primeiros `qualifiedCount` participantes da classificacao.
9. Nao e permitido gerar a fase mata-mata se ja existir qualquer partida fora da fase `LEAGUE`.
10. Ao gerar, o campeonato muda para `KNOCKOUT_STAGE`.
11. A geracao das partidas e a troca de status acontecem na mesma transaction.
12. A fase mata-mata usa a mesma progressao automatica do formato `KNOCKOUT`.

Fases geradas:

1. 2 classificados geram `FINAL`.
2. 4 classificados geram `SEMI_FINAL`.
3. 8 classificados geram `QUARTER_FINAL`.
4. 16 classificados geram `ROUND_OF_16`.

Pareamento:

1. O primeiro colocado enfrenta o ultimo classificado.
2. O segundo colocado enfrenta o penultimo classificado.
3. A regra continua ate formar todos os confrontos da fase.

## Inicio de campeonatos mata-mata

Nesta etapa, campeonatos com formato `KNOCKOUT` podem gerar automaticamente apenas a primeira fase eliminatoria.

Regras:

1. O campeonato precisa existir.
2. O campeonato precisa estar com status `DRAFT`.
3. O campeonato precisa ter exatamente 4, 8 ou 16 participantes.
4. A ordem de cadastro dos participantes define os confrontos.
5. O pareamento usa o primeiro contra o ultimo, o segundo contra o penultimo, e assim por diante.
6. Com 4 participantes, a fase gerada e `SEMI_FINAL`.
7. Com 8 participantes, a fase gerada e `QUARTER_FINAL`.
8. Com 16 participantes, a fase gerada e `ROUND_OF_16`.
9. Todas as partidas geradas usam `round = 1` e `status = PENDING`.
10. A geracao das partidas e a troca de status para `IN_PROGRESS` acontecem na mesma transaction.
11. O campeonato nao pode ser iniciado duas vezes.
12. Ida e volta, disputa de terceiro lugar e avanco automatico ainda nao sao tratados nesta etapa.

## Registro de resultados da liga

Partidas da fase `LEAGUE` permitem empate e nao geram avanco eliminatorio.

Regras:

1. A partida precisa existir.
2. O campeonato da partida precisa existir.
3. O campeonato precisa estar com status `IN_PROGRESS`.
4. O placar do mandante e do visitante e obrigatorio.
5. Placar deve ser um numero inteiro maior ou igual a zero.
6. Empates sao permitidos em partidas de liga.
7. Ao registrar resultado, a partida recebe `status = FINISHED`.
8. O campo `playedAt` e atualizado sempre que o resultado for registrado ou alterado.
9. Partidas finalizadas podem ter o resultado corrigido.
10. Em empate, `winnerParticipantId` fica `null`.
11. Quando houver vencedor, `winnerParticipantId` recebe o participante mandante ou visitante conforme o placar.
12. O registro de resultado nao persiste classificacao; a tabela e calculada sob demanda.

## Registro de resultados no mata-mata

Partidas eliminatorias precisam ter um vencedor.

Regras:

1. A partida precisa existir.
2. O campeonato da partida precisa existir.
3. O campeonato precisa estar com status `IN_PROGRESS` ou, para `LEAGUE_KNOCKOUT`, `KNOCKOUT_STAGE`.
4. O placar do mandante e do visitante e obrigatorio.
5. Placar deve ser um numero inteiro maior ou igual a zero.
6. Empates nao sao permitidos.
7. `winnerParticipantId` e definido automaticamente pelo maior placar.
8. Ao registrar resultado, a partida recebe `status = FINISHED`.
9. O campo `playedAt` e atualizado sempre que o resultado for registrado.
10. Quando todas as partidas da fase atual terminam, a proxima fase e gerada automaticamente.
11. Se a proxima fase ja existir, ela nao e recriada.
12. Se a proxima fase ainda estiver pendente, seus participantes podem ser atualizados em caso de correcao de resultado da fase anterior.

## Avanco automatico no mata-mata

O avanco no mata-mata e calculado a partir dos vencedores da fase atual, ordenados por `matchOrder`.

Fases:

1. `ROUND_OF_16` gera `QUARTER_FINAL`.
2. `QUARTER_FINAL` gera `SEMI_FINAL`.
3. `SEMI_FINAL` gera `FINAL`.
4. `FINAL` finaliza o campeonato.

Regras:

1. A proxima fase usa `round` incrementado.
2. Vencedores sao agrupados de dois em dois.
3. O primeiro vencedor do par vira mandante.
4. O segundo vencedor do par vira visitante.
5. Quando a `FINAL` termina, o campeonato passa para `FINISHED`.
6. O campeao da final e salvo em `championParticipantId`.
7. O participante campeao recebe status `CHAMPION`.

## Classificacao da liga

A classificacao da liga e calculada dinamicamente a partir das partidas finalizadas.

Regras:

1. O campeonato precisa existir.
2. O campeonato precisa ser do formato `LEAGUE` ou `LEAGUE_KNOCKOUT`.
3. Apenas partidas com `status = FINISHED` entram no calculo.
4. Participantes sem partidas finalizadas aparecem com estatisticas zeradas.
5. Vitoria vale 3 pontos.
6. Empate vale 1 ponto.
7. Derrota vale 0 pontos.
8. A classificacao nao e persistida no banco nesta etapa.

Criterios de ordenacao:

1. Maior numero de pontos.
2. Maior numero de vitorias.
3. Maior saldo de gols.
4. Maior numero de gols marcados.
5. Nome do participante em ordem alfabetica.

## Finalizacao de campeonatos de liga

Nesta etapa, apenas campeonatos com formato `LEAGUE` podem ser finalizados automaticamente.

Regras:

1. O campeonato precisa existir.
2. O campeonato precisa estar com status `IN_PROGRESS`.
3. O campeonato precisa ter participantes.
4. O campeonato precisa ter partidas.
5. Todas as partidas precisam estar com status `FINISHED`.
6. O campeao e o primeiro colocado da classificacao calculada pela API.
7. Ao finalizar, o campeonato passa para `FINISHED`.
8. O campo `championParticipantId` do campeonato recebe o ID do campeao.
9. O participante campeao passa para `CHAMPION`.
10. Os demais participantes permanecem `ACTIVE` nesta etapa, para manter a finalizacao simples.
11. Um campeonato `FINISHED` nao pode ser finalizado novamente.

## Pagina publica do campeonato

A pagina publica permite compartilhar a visualizacao de um campeonato sem autenticacao.

Regras:

1. A URL publica usa o `slug` do campeonato.
2. A visualizacao publica e somente leitura.
3. A pagina publica nao permite editar campeonato, participantes, partidas ou resultados.
4. Dados sensiveis do usuario dono nao devem ser retornados pela API publica.
5. A pagina publica mostra campeonato, participantes, partidas, classificacao e campeao quando houver.

## Decisoes pendentes

1. Como aplicar penaltis em fases eliminatorias.
2. Como validar quantidade minima e maxima de participantes.
3. Como encerrar automaticamente uma liga.
4. Como tratar criterios adicionais de desempate, se necessario.
