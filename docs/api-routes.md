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

Inicia um campeonato e gera automaticamente partidas de liga.

Regras:

- Retorna `404` se o campeonato nao existir.
- Retorna `409` se o campeonato ja tiver sido iniciado.
- Retorna `400` se o campeonato tiver menos de 3 participantes.
- Retorna `400` se o formato for `KNOCKOUT` ou `LEAGUE_KNOCKOUT`.
- Atualmente apenas campeonatos `LEAGUE` podem ser iniciados.
- A geracao de partidas e a alteracao de status para `IN_PROGRESS` acontecem em uma transaction.

Resposta:

```json
{
  "id": "tournament-id",
  "status": "IN_PROGRESS",
  "matches": []
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

## Rotas planejadas

- `PATCH /matches/:id/result`
