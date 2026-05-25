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

Validações:

- `name` é obrigatório.
- `format` é obrigatório.
- `format` deve ser `LEAGUE`, `KNOCKOUT` ou `LEAGUE_KNOCKOUT`.
- `qualifiedCount` é obrigatório quando `format` for `LEAGUE_KNOCKOUT`.
- `qualifiedCount` deve ser `2`, `4`, `8` ou `16` quando informado.

### GET /tournaments

Lista campeonatos cadastrados.

### GET /tournaments/:id

Busca um campeonato por ID.

### PATCH /tournaments/:id

Atualiza dados básicos de um campeonato.

### DELETE /tournaments/:id

Remove fisicamente um campeonato. Nesta etapa ainda não há partidas associadas.

## Rotas planejadas

### Usuarios

- `POST /users`
- `GET /users/:id`

### Campeonatos

- Regras de transição de status.
- Encerramento de campeonato.
- Duplicação de campeonato.

### Participantes

- `POST /tournaments/:tournamentId/participants`
- `GET /tournaments/:tournamentId/participants`
- `PATCH /participants/:id`

### Partidas

- `GET /tournaments/:tournamentId/matches`
- `PATCH /matches/:id/result`

## Observacoes

As rotas acima ainda nao foram implementadas. Elas servem como guia inicial para o MVP.
