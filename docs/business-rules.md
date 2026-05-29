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

- `PENDING`
- `ACTIVE`
- `REJECTED`
- `ELIMINATED`
- `CHAMPION`

Regras:

1. Participantes criados manualmente pelo dono do campeonato entram como `ACTIVE`.
2. Participantes inscritos por convite publico entram como `PENDING`.
3. Participantes rejeitados ficam com `REJECTED`.
4. A listagem padrao de participantes do campeonato retorna apenas `ACTIVE`.
5. A listagem de pendentes retorna apenas `PENDING`.
6. Somente participantes `ACTIVE` entram na geracao de partidas.

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
3. O campeonato precisa ter pelo menos 2 participantes ativos.
4. Ao iniciar, o sistema gera partidas para todos os pares unicos de participantes ativos.
5. A ordem dos confrontos e embaralhada antes da geracao para evitar uma tabela sempre sequencial.
6. As rodadas sao balanceadas: dentro da mesma rodada, um participante aparece no maximo uma vez.
7. Em jogo unico, uma liga com `N` participantes gera `N * (N - 1) / 2` partidas.
8. Com 4 participantes, por exemplo, os confrontos sao `A x B`, `A x C`, `A x D`, `B x C`, `B x D` e `C x D`, em ordem variavel.
9. Se `isTwoLegged` for `true`, o sistema gera tambem a partida inversa de cada confronto, totalizando `N * (N - 1)` partidas.
10. Todas as partidas geradas usam `phase = LEAGUE` e `status = PENDING`.
11. A geracao das partidas e a troca de status para `IN_PROGRESS` acontecem na mesma transaction.
12. O campeonato nao pode ser iniciado duas vezes.

## Inicio de campeonatos liga + mata-mata

Campeonatos com formato `LEAGUE_KNOCKOUT` iniciam pelo mesmo fluxo da liga, gerando apenas partidas da fase `LEAGUE` neste MVP.

Regras:

1. O campeonato precisa existir.
2. O campeonato precisa estar com status `DRAFT`.
3. O campeonato precisa ter pelo menos 2 participantes ativos.
4. `qualifiedCount` e obrigatorio.
5. `qualifiedCount` deve ser `2`, `4`, `8` ou `16`.
6. `qualifiedCount` nao pode ser maior que o numero de participantes.
7. Ao iniciar, o sistema gera partidas para todos os pares unicos de participantes ativos.
8. A ordem dos confrontos e embaralhada antes da geracao para evitar uma tabela sempre sequencial.
9. As rodadas sao balanceadas: dentro da mesma rodada, um participante aparece no maximo uma vez.
10. Em jogo unico, uma fase de liga com `N` participantes gera `N * (N - 1) / 2` partidas.
11. Se `isTwoLegged` for `true`, o sistema gera tambem a partida inversa de cada confronto, totalizando `N * (N - 1)` partidas.
12. Todas as partidas geradas usam `phase = LEAGUE` e `status = PENDING`.
13. A fase mata-mata nao e gerada nesta etapa.
14. A geracao das partidas e a troca de status para `IN_PROGRESS` acontecem na mesma transaction.
15. O campeonato nao pode ser iniciado duas vezes.

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
13. Se o campeonato tiver disputa de terceiro lugar, ela e gerada junto com a final depois que as semifinais terminam.

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
3. O campeonato precisa ter exatamente 4, 8 ou 16 participantes ativos.
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
12. Campos de penaltis enviados em partidas de liga sao ignorados e limpos.
13. O registro de resultado nao persiste classificacao; a tabela e calculada sob demanda.

## Registro de resultados no mata-mata

Partidas eliminatorias precisam ter um vencedor, mas podem empatar no tempo normal quando houver decisao por penaltis.

Regras:

1. A partida precisa existir.
2. O campeonato da partida precisa existir.
3. O campeonato precisa estar com status `IN_PROGRESS` ou, para `LEAGUE_KNOCKOUT`, `KNOCKOUT_STAGE`.
4. O placar do mandante e do visitante e obrigatorio.
5. Placar deve ser um numero inteiro maior ou igual a zero.
6. Se o placar normal tiver vencedor, os campos de penaltis sao limpos.
7. Se o placar normal empatar, `homePenaltyScore` e `awayPenaltyScore` sao obrigatorios.
8. Penaltis devem ser numeros inteiros maiores ou iguais a zero.
9. A disputa de penaltis precisa ter um vencedor.
10. `winnerParticipantId` e definido automaticamente pelo maior placar normal ou pelo maior placar nos penaltis.
11. Ao registrar resultado, a partida recebe `status = FINISHED`.
12. O campo `playedAt` e atualizado sempre que o resultado for registrado.
13. Quando todas as partidas da fase atual terminam, a proxima fase e gerada automaticamente.
14. Se a proxima fase ja existir, ela nao e recriada.
15. Se a proxima fase ainda estiver pendente, seus participantes podem ser atualizados em caso de correcao de resultado da fase anterior.
16. Se a proxima fase ja tiver iniciado, o sistema mantem o comportamento atual e nao recria o chaveamento.

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
5. Quando a semifinal termina e `hasThirdPlaceMatch` esta ativo, os perdedores das semifinais geram a partida `THIRD_PLACE`.
6. Quando nao ha disputa de terceiro lugar, a `FINAL` finalizada encerra o campeonato.
7. Quando ha disputa de terceiro lugar, o campeonato so encerra depois que `FINAL` e `THIRD_PLACE` estiverem finalizadas.
8. O campeao da final e salvo em `championParticipantId`.
9. O participante campeao recebe status `CHAMPION`.

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

## Estatisticas do campeonato

As estatisticas do campeonato sao calculadas dinamicamente a partir das partidas finalizadas.

Regras:

1. O campeonato precisa existir e pertencer ao usuario autenticado.
2. Apenas partidas com `status = FINISHED` entram nos calculos de gols, media, destaques e estatisticas por participante.
3. Partidas `PENDING` entram apenas nos contadores de partidas pendentes.
4. Participantes considerados nas estatisticas individuais: `ACTIVE`, `ELIMINATED` e `CHAMPION`.
5. Participantes `PENDING` e `REJECTED` nao entram nas estatisticas.
6. Se nao houver partidas finalizadas, os totais de gols e medias ficam zerados e os destaques retornam arrays vazios.
7. `averageGoalsPerMatch` e calculado por `totalGoals / finishedMatches`.
8. A partida com mais gols considera a soma dos placares dos dois participantes.
9. A maior goleada considera a maior diferenca absoluta de gols em partidas com vencedor.
10. Melhor defesa considera apenas participantes com pelo menos 1 jogo.
11. Empates em destaques retornam todos os participantes empatados.
12. As estatisticas nao sao persistidas no banco nesta etapa.

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

## Convite e inscricao publica

O criador pode compartilhar um link publico para amigos se inscreverem como participantes enquanto o campeonato ainda esta em rascunho.

Regras:

1. O convite possui `inviteEnabled`, `inviteCode` e `maxParticipants`.
2. Dados de convite nao exigem autenticacao.
3. A inscricao publica nao exige login.
4. `canJoin` e `true` apenas quando o campeonato esta em `DRAFT`, o convite esta ativo e ainda ha vagas.
5. Inscricoes publicas sao bloqueadas quando o campeonato sai de `DRAFT`.
6. Inscricoes publicas sao bloqueadas quando `inviteEnabled` e `false`.
7. Se `maxParticipants` estiver definido, participantes `ACTIVE` e `PENDING` contam para o limite.
8. Participantes `REJECTED` nao contam para o limite.
9. O dono pode alterar `inviteEnabled` e `maxParticipants` apenas enquanto o campeonato esta em `DRAFT`.
10. O dono pode regenerar `inviteCode`.
11. `maxParticipants` nao pode ser menor que a quantidade atual de participantes `ACTIVE` e `PENDING`.
12. Para `KNOCKOUT`, `maxParticipants` deve ser `4`, `8` ou `16`.
13. Para `LEAGUE_KNOCKOUT`, `maxParticipants` nao pode ser menor que `qualifiedCount`.
14. `name` e obrigatorio.
15. `nickname` e opcional.
16. `teamName` e opcional.
17. Nao pode existir participante com o mesmo `name` dentro do campeonato.
18. Nao pode existir participante com o mesmo `nickname` dentro do campeonato quando `nickname` for informado.
19. Participantes inscritos por convite entram com `status = PENDING`.
20. Participantes `PENDING` precisam ser aprovados pelo dono antes de entrar no campeonato.
21. Aprovacao e rejeicao so podem acontecer enquanto o campeonato esta em `DRAFT`.
22. Apenas o dono do campeonato pode aprovar ou rejeitar inscricoes.
23. Ao aprovar, o participante passa para `ACTIVE`.
24. Ao rejeitar, o participante passa para `REJECTED`.
25. O dono pode aprovar todas as inscricoes pendentes de uma vez enquanto o campeonato esta em `DRAFT`.
26. Neste MVP, e permitido iniciar um campeonato com inscricoes `PENDING`; elas sao ignoradas e apenas participantes `ACTIVE` entram na geracao de partidas.
27. Dados sensiveis do dono do campeonato nao sao retornados nas rotas de convite.

## Decisoes pendentes

1. Como encerrar automaticamente uma liga.
2. Como tratar criterios adicionais de desempate, se necessario.
