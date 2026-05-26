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

Nesta etapa, apenas campeonatos com formato `LEAGUE` podem ser iniciados automaticamente.

Regras:

1. O campeonato precisa existir.
2. O campeonato precisa estar com status `DRAFT`.
3. O campeonato precisa ter pelo menos 3 participantes.
4. Formatos `KNOCKOUT` e `LEAGUE_KNOCKOUT` ainda nao podem ser iniciados.
5. Ao iniciar, o sistema gera partidas para todos os pares de participantes.
6. Se `isTwoLegged` for `true`, o sistema gera tambem a partida inversa de cada confronto.
7. Todas as partidas geradas usam `phase = LEAGUE` e `status = PENDING`.
8. A geracao das partidas e a troca de status para `IN_PROGRESS` acontecem na mesma transaction.
9. O campeonato nao pode ser iniciado duas vezes.

## Registro de resultados da liga

Nesta etapa, apenas partidas da fase `LEAGUE` podem receber resultado.

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

## Classificacao da liga

A classificacao da liga e calculada dinamicamente a partir das partidas finalizadas.

Regras:

1. O campeonato precisa existir.
2. O campeonato precisa ser do formato `LEAGUE`.
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
