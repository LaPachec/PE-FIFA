# Rotas da API

## Rotas implementadas

### GET /health

Retorna o status basico da aplicacao.

Resposta esperada:

```json
{
  "status": "ok",
  "service": "fifa-tournament-manager-api",
  "timestamp": "2026-05-25T00:00:00.000Z"
}
```

## Rotas publicas

### GET /public/tournaments/:slug

Retorna os dados publicos de um campeonato para exibicao compartilhavel e somente leitura.

Regras:

- Usa o `slug` do campeonato na URL.
- Retorna `404` se o campeonato nao existir.
- Nao exige autenticacao.
- Nao retorna dados sensiveis do usuario dono.
- Retorna dados do campeonato, participantes, partidas, classificacao e campeao quando houver.

Resposta:

```json
{
  "tournament": {
    "id": "tournament-id",
    "name": "Copa dos Amigos",
    "slug": "copa-dos-amigos",
    "description": "Campeonato local",
    "format": "LEAGUE",
    "status": "IN_PROGRESS",
    "championParticipantId": null
  },
  "participants": [],
  "matches": [],
  "standings": [],
  "champion": null
}
```

## Campeonatos

### POST /tournaments

Cria um campeonato com status inicial `DRAFT`.

Body:

```json
{
  "name": "Copa dos Amigos",
  "description": "Campeonato local entre amigos",
  "format": "LEAGUE_KNOCKOUT",
  "isTwoLegged": false,
  "qualifiedCount": 4,
  "hasThirdPlaceMatch": true
}
```

Validacoes:

- `name` e obrigatorio.
- `format` e obrigatorio.
- `format` deve ser `LEAGUE`, `KNOCKOUT` ou `LEAGUE_KNOCKOUT`.
- `qualifiedCount` e obrigatorio quando `format` for `LEAGUE_KNOCKOUT`.
- `qualifiedCount` deve ser `2`, `4`, `8` ou `16` quando informado.

### GET /tournaments

Lista campeonatos cadastrados.

### GET /tournaments/:id

Busca um campeonato por ID.

### PATCH /tournaments/:id

Atualiza dados basicos de um campeonato.

### DELETE /tournaments/:id

Remove fisicamente um campeonato.

### POST /tournaments/:id/start

Inicia um campeonato e gera automaticamente as partidas iniciais conforme o formato.

Regras:

- Retorna `404` se o campeonato nao existir.
- Retorna `409` se o campeonato ja tiver sido iniciado.
- Para `LEAGUE`, retorna `400` se o campeonato tiver menos de 3 participantes.
- Para `KNOCKOUT`, retorna `400` se o campeonato nao tiver exatamente 4, 8 ou 16 participantes.
- Para `LEAGUE_KNOCKOUT`, retorna `400` porque o formato ainda nao foi implementado.
- A geracao de partidas e a alteracao de status para `IN_PROGRESS` acontecem em uma transaction.

Comportamento por formato:

- `LEAGUE`: gera partidas entre todos os pares de participantes. Se `isTwoLegged` for `true`, gera tambem os confrontos inversos.
- `KNOCKOUT`: gera apenas a primeira fase eliminatoria.
- `LEAGUE_KNOCKOUT`: ainda nao inicia automaticamente.

Fases iniciais do mata-mata:

- 4 participantes: `SEMI_FINAL`.
- 8 participantes: `QUARTER_FINAL`.
- 16 participantes: `ROUND_OF_16`.

Resposta:

```json
{
  "id": "tournament-id",
  "status": "IN_PROGRESS",
  "matches": []
}
```

### POST /tournaments/:id/finish

Finaliza um campeonato de liga e define automaticamente o campeao pela classificacao atual.

Regras:

- Retorna `404` se o campeonato nao existir.
- Retorna `400` se o campeonato nao for do formato `LEAGUE`.
- Retorna `409` se o campeonato nao estiver em `IN_PROGRESS`.
- Retorna `400` se o campeonato nao tiver participantes.
- Retorna `400` se o campeonato nao tiver partidas.
- Retorna `409` se existir partida pendente.
- O campeao e o primeiro colocado em `GET /tournaments/:id/standings`.
- Ao finalizar, o campeonato fica com `status = FINISHED`.
- O campo `championParticipantId` recebe o participante campeao.
- O participante campeao fica com `status = CHAMPION`.
- Os demais participantes permanecem com `status = ACTIVE` nesta etapa.

Resposta:

```json
{
  "id": "tournament-id",
  "status": "FINISHED",
  "championParticipantId": "participant-id"
}
```

## Participantes

### GET /tournaments/:tournamentId/participants

Lista participantes de um campeonato.

Regras:

- Retorna `404` se o campeonato nao existir.

### POST /tournaments/:tournamentId/participants

Cria um participante dentro de um campeonato.

Body:

```json
{
  "name": "Jogador 1",
  "nickname": "jogador1",
  "teamName": "Real Madrid"
}
```

Validacoes e regras:

- `name` e obrigatorio.
- `nickname` e opcional.
- `teamName` e opcional.
- O status inicial do participante e `ACTIVE`.
- Retorna `404` se o campeonato nao existir.
- Retorna `409` se o campeonato nao estiver em `DRAFT`.
- Nao permite dois participantes com o mesmo `name` no mesmo campeonato.
- Nao permite dois participantes com o mesmo `nickname` no mesmo campeonato quando `nickname` for informado.

### GET /participants/:id

Busca um participante por ID.

Regras:

- Retorna `404` se o participante nao existir.

### PATCH /participants/:id

Atualiza dados basicos de um participante.

Body:

```json
{
  "name": "Jogador Atualizado",
  "nickname": "novo-nick",
  "teamName": "Barcelona"
}
```

Validacoes e regras:

- `name`, `nickname` e `teamName` sao opcionais no update.
- `name`, quando informado, nao pode ser vazio.
- Retorna `404` se o participante nao existir.
- Retorna `409` se o campeonato do participante nao estiver em `DRAFT`.
- Mantem as regras de unicidade de `name` e `nickname` dentro do campeonato.

### DELETE /participants/:id

Remove fisicamente um participante.

Regras:

- Retorna `404` se o participante nao existir.
- Retorna `409` se o campeonato do participante nao estiver em `DRAFT`.

## Rotas planejadas

### Usuarios

- `POST /users`
- `GET /users/:id`

### Campeonatos

- Regras de transicao de status.
- Encerramento de campeonato.
- Duplicacao de campeonato.

## Partidas

### GET /tournaments/:tournamentId/matches

Lista partidas de um campeonato.

Regras:

- Retorna `404` se o campeonato nao existir.
- As partidas sao ordenadas por `round` e `matchOrder`.

### PATCH /matches/:id/result

Registra ou atualiza o resultado de uma partida.

Body:

```json
{
  "homeScore": 3,
  "awayScore": 1
}
```

Validacoes e regras:

- `homeScore` e obrigatorio, inteiro e nao pode ser negativo.
- `awayScore` e obrigatorio, inteiro e nao pode ser negativo.
- Retorna `404` se a partida nao existir.
- Retorna `404` se o campeonato da partida nao existir.
- Retorna `409` se o campeonato nao estiver em `IN_PROGRESS`.
- Partidas com `phase = LEAGUE` permitem empate.
- Partidas eliminatorias nao permitem empate.
- Em partidas eliminatorias, o vencedor e definido automaticamente pelo maior placar.
- Ao registrar resultado, a partida fica com `status = FINISHED` e `playedAt` atualizado.
- Se a partida ja estiver finalizada, o resultado pode ser atualizado.
- No mata-mata, quando todas as partidas da fase atual terminam, a proxima fase e gerada automaticamente.
- Quando a `FINAL` termina, o campeonato passa para `FINISHED`, `championParticipantId` e salvo e o campeao recebe status `CHAMPION`.

## Classificacao

### GET /tournaments/:id/standings

Retorna a classificacao calculada dinamicamente para campeonatos de liga.

Regras:

- Retorna `404` se o campeonato nao existir.
- Retorna `400` se o campeonato nao for do formato `LEAGUE`.
- Considera apenas partidas com `status = FINISHED`.
- Participantes sem partidas finalizadas aparecem com todos os numeros zerados.
- Vitoria vale 3 pontos.
- Empate vale 1 ponto.
- Derrota vale 0 pontos.
- A resposta ja vem ordenada e com `position` calculado.

Resposta:

```json
[
  {
    "position": 1,
    "participantId": "participant-id",
    "name": "Lucas",
    "nickname": "Lukinhas",
    "teamName": "Real Madrid",
    "points": 6,
    "played": 2,
    "wins": 2,
    "draws": 0,
    "losses": 0,
    "goalsFor": 7,
    "goalsAgainst": 2,
    "goalDifference": 5
  }
]
```
