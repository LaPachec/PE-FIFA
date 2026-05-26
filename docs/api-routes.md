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

## Autenticacao

### POST /auth/register

Cria um usuario real da aplicacao e retorna um token JWT.

Body:

```json
{
  "name": "Lucas",
  "email": "lucas@example.com",
  "password": "123456"
}
```

Regras:

- `name`, `email` e `password` sao obrigatorios.
- `email` deve ser unico.
- `password` deve ter no minimo 6 caracteres.
- A senha e armazenada como hash.
- Retorna `409` se o email ja estiver em uso.
- Nao retorna `passwordHash`.

### POST /auth/login

Autentica um usuario existente e retorna um token JWT.

Body:

```json
{
  "email": "lucas@example.com",
  "password": "123456"
}
```

Regras:

- `email` e `password` sao obrigatorios.
- Retorna `401` se as credenciais forem invalidas.
- Nao retorna `passwordHash`.

### GET /auth/me

Retorna os dados basicos do usuario autenticado.

Headers:

```http
Authorization: Bearer <token>
```

Regras:

- Exige token JWT valido.
- Retorna `401` se o token estiver ausente, invalido ou expirado.
- Nao retorna `passwordHash`.

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

### GET /public/tournaments/:slug/invite

Retorna os dados publicos necessarios para exibir um convite de inscricao.

Regras:

- Nao exige autenticacao.
- Retorna `404` se o campeonato nao existir.
- Nao retorna dados sensiveis do usuario dono.
- `canJoin` e `true` apenas quando o campeonato esta em `DRAFT`.

Resposta:

```json
{
  "id": "tournament-id",
  "name": "Copa dos Amigos",
  "slug": "copa-dos-amigos",
  "description": "Campeonato local",
  "format": "LEAGUE",
  "status": "DRAFT",
  "totalParticipants": 4,
  "canJoin": true
}
```

### POST /public/tournaments/:slug/join

Permite que uma pessoa se inscreva publicamente como participante de um campeonato.

Body:

```json
{
  "name": "Lucas",
  "nickname": "Lukinhas",
  "teamName": "Real Madrid"
}
```

Regras:

- Nao exige autenticacao.
- Retorna `404` se o campeonato nao existir.
- Retorna `409` se o campeonato nao estiver em `DRAFT`.
- `name` e obrigatorio.
- `nickname` e opcional.
- `teamName` e opcional.
- Nao permite dois participantes com o mesmo `name` no mesmo campeonato.
- Nao permite dois participantes com o mesmo `nickname` no mesmo campeonato quando `nickname` for informado.
- O participante criado recebe `status = PENDING`.
- A resposta informa que a inscricao aguarda aprovacao do criador.

Resposta:

```json
{
  "message": "Registration received and is awaiting approval",
  "participant": {
    "id": "participant-id",
    "tournamentId": "tournament-id",
    "name": "Lucas",
    "nickname": "Lukinhas",
    "teamName": "Real Madrid",
    "status": "PENDING"
  }
}
```

## Dashboard

### GET /dashboard/summary

Retorna um resumo dos campeonatos do usuario autenticado para uso no dashboard.

Headers:

```http
Authorization: Bearer <token>
```

Regras:

- Exige usuario autenticado.
- Retorna apenas campeonatos do usuario logado.
- Campeonatos sao ordenados por `updatedAt` descendente.
- Nao retorna dados sensiveis do usuario.
- Se o usuario nao tiver campeonatos, retorna contadores zerados e `tournaments` vazio.
- `finishedMatches` e `pendingMatches` sao calculados com base nas partidas do campeonato.
- `nextPendingMatch`, quando existir, usa a primeira partida pendente ordenada por `round` e `matchOrder`.

Resposta:

```json
{
  "stats": {
    "totalTournaments": 5,
    "draftTournaments": 1,
    "inProgressTournaments": 2,
    "knockoutStageTournaments": 1,
    "finishedTournaments": 1
  },
  "tournaments": [
    {
      "id": "tournament-id",
      "name": "Copa dos Amigos",
      "slug": "copa-dos-amigos",
      "description": "Campeonato local",
      "format": "LEAGUE",
      "status": "IN_PROGRESS",
      "createdAt": "2026-05-25T00:00:00.000Z",
      "updatedAt": "2026-05-25T00:00:00.000Z",
      "champion": null,
      "totalParticipants": 8,
      "totalMatches": 28,
      "finishedMatches": 12,
      "pendingMatches": 16,
      "publicPath": "/public/tournaments/copa-dos-amigos",
      "nextPendingMatch": {
        "id": "match-id",
        "homeParticipantName": "Lucas",
        "awayParticipantName": "Pedro",
        "phase": "LEAGUE",
        "round": 2
      }
    }
  ]
}
```

## Campeonatos

As rotas privadas de campeonatos exigem autenticacao via `Authorization: Bearer <token>`.

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
- `ownerId` e definido automaticamente pelo usuario autenticado.

### GET /tournaments

Lista apenas campeonatos do usuario autenticado.

### GET /tournaments/:id

Busca um campeonato por ID.

### PATCH /tournaments/:id

Atualiza dados basicos de um campeonato.

Regras:

- O campeonato precisa pertencer ao usuario autenticado.

### DELETE /tournaments/:id

Remove fisicamente um campeonato.

Regras:

- O campeonato precisa pertencer ao usuario autenticado.

### POST /tournaments/:id/start

Inicia um campeonato e gera automaticamente as partidas iniciais conforme o formato.

Regras:

- Retorna `404` se o campeonato nao existir.
- Retorna `404` se o campeonato nao pertencer ao usuario autenticado.
- Retorna `409` se o campeonato ja tiver sido iniciado.
- Para `LEAGUE`, retorna `400` se o campeonato tiver menos de 3 participantes.
- Para `KNOCKOUT`, retorna `400` se o campeonato nao tiver exatamente 4, 8 ou 16 participantes.
- Para `LEAGUE_KNOCKOUT`, retorna `400` se tiver menos de 3 participantes.
- Para `LEAGUE_KNOCKOUT`, `qualifiedCount` e obrigatorio, deve ser `2`, `4`, `8` ou `16`, e nao pode ser maior que o numero de participantes.
- A geracao de partidas e a alteracao de status para `IN_PROGRESS` acontecem em uma transaction.

Comportamento por formato:

- `LEAGUE`: gera partidas entre todos os pares de participantes. Se `isTwoLegged` for `true`, gera tambem os confrontos inversos.
- `KNOCKOUT`: gera apenas a primeira fase eliminatoria.
- `LEAGUE_KNOCKOUT`: gera inicialmente apenas as partidas da fase `LEAGUE`. A fase mata-mata ainda nao e criada neste endpoint.

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

### POST /tournaments/:id/generate-knockout-stage

Gera a primeira fase mata-mata de um campeonato `LEAGUE_KNOCKOUT` usando os melhores classificados da fase de liga.

Regras:

- Retorna `404` se o campeonato nao existir.
- Retorna `400` se o campeonato nao for do formato `LEAGUE_KNOCKOUT`.
- Retorna `409` se o campeonato nao estiver em `IN_PROGRESS`.
- Retorna `409` se existir partida da fase `LEAGUE` pendente.
- Retorna `400` se `qualifiedCount` nao estiver configurado como `2`, `4`, `8` ou `16`.
- Retorna `400` se `qualifiedCount` for maior que o numero de participantes.
- Retorna `409` se ja existir qualquer partida com fase diferente de `LEAGUE`.
- Calcula a classificacao com os mesmos criterios de `GET /tournaments/:id/standings`.
- Seleciona os primeiros `qualifiedCount` participantes da classificacao.
- Gera a primeira fase eliminatoria e altera o campeonato para `KNOCKOUT_STAGE`.
- A geracao das partidas e a alteracao de status acontecem em uma transaction.

Fases geradas:

- 2 classificados: `FINAL`.
- 4 classificados: `SEMI_FINAL`.
- 8 classificados: `QUARTER_FINAL`.
- 16 classificados: `ROUND_OF_16`.

Pareamento:

- Usa seed por classificacao: 1o contra ultimo classificado, 2o contra penultimo, e assim por diante.

Resposta:

```json
{
  "id": "tournament-id",
  "status": "KNOCKOUT_STAGE",
  "matches": []
}
```

## Participantes

### GET /tournaments/:tournamentId/participants

Lista participantes ativos de um campeonato.

Regras:

- Retorna `404` se o campeonato nao existir.
- Retorna apenas participantes com `status = ACTIVE`.

### GET /tournaments/:tournamentId/participants/pending

Lista inscricoes publicas pendentes de aprovacao em um campeonato.

Headers:

```http
Authorization: Bearer <token>
```

Regras:

- Exige usuario autenticado.
- Apenas o dono do campeonato pode listar pendentes.
- Retorna `404` se o campeonato nao existir.
- Retorna `403` se o campeonato nao pertencer ao usuario autenticado.
- Retorna apenas participantes com `status = PENDING`.

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

### PATCH /participants/:id/approve

Aprova uma inscricao publica pendente.

Headers:

```http
Authorization: Bearer <token>
```

Regras:

- Exige usuario autenticado.
- Apenas o dono do campeonato pode aprovar.
- Retorna `404` se o participante nao existir.
- Retorna `403` se o participante pertencer a campeonato de outro usuario.
- Retorna `409` se o campeonato nao estiver em `DRAFT`.
- Retorna `409` se o participante nao estiver com `status = PENDING`.
- Ao aprovar, altera o status para `ACTIVE`.

### PATCH /participants/:id/reject

Rejeita uma inscricao publica pendente.

Headers:

```http
Authorization: Bearer <token>
```

Regras:

- Exige usuario autenticado.
- Apenas o dono do campeonato pode rejeitar.
- Retorna `404` se o participante nao existir.
- Retorna `403` se o participante pertencer a campeonato de outro usuario.
- Retorna `409` se o campeonato nao estiver em `DRAFT`.
- Retorna `409` se o participante nao estiver com `status = PENDING`.
- Ao rejeitar, altera o status para `REJECTED`.

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
- Para partidas eliminatorias de `LEAGUE_KNOCKOUT`, tambem aceita campeonato em `KNOCKOUT_STAGE`.
- Partidas com `phase = LEAGUE` permitem empate.
- Partidas eliminatorias nao permitem empate.
- Em partidas eliminatorias, o vencedor e definido automaticamente pelo maior placar.
- Ao registrar resultado, a partida fica com `status = FINISHED` e `playedAt` atualizado.
- Se a partida ja estiver finalizada, o resultado pode ser atualizado.
- No mata-mata, quando todas as partidas da fase atual terminam, a proxima fase e gerada automaticamente.
- Quando a `FINAL` termina, o campeonato passa para `FINISHED`, `championParticipantId` e salvo e o campeao recebe status `CHAMPION`.

## Classificacao

### GET /tournaments/:id/standings

Retorna a classificacao calculada dinamicamente para campeonatos com fase de liga.

Regras:

- Retorna `404` se o campeonato nao existir.
- Retorna `400` se o campeonato nao for do formato `LEAGUE` ou `LEAGUE_KNOCKOUT`.
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
