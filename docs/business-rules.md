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

## Decisoes pendentes

1. Criterios de desempate na liga.
2. Como montar confrontos automaticamente.
3. Como tratar partidas de ida e volta.
4. Como aplicar penaltis em fases eliminatorias.
5. Como validar quantidade minima e maxima de participantes.
