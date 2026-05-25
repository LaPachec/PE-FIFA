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

## Decisoes pendentes

1. Criterios de desempate na liga.
2. Como montar confrontos automaticamente.
3. Como tratar partidas de ida e volta.
4. Como aplicar penaltis em fases eliminatorias.
5. Como validar quantidade minima e maxima de participantes.
