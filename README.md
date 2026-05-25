# FIFA Tournament Manager

FIFA Tournament Manager é uma aplicação pessoal para criação e gerenciamento de campeonatos de FIFA/EA FC entre amigos.

O objetivo do projeto é substituir controles manuais em planilhas, grupos de mensagem e anotações soltas por uma plataforma simples, organizada e preparada para evoluir com regras de campeonato mais completas.

## Visão Geral Do Produto

A aplicação deve permitir que um grupo de jogadores crie campeonatos, cadastre participantes, acompanhe partidas e visualize o progresso da competição.

No longo prazo, o sistema deve apoiar diferentes formatos de torneio, como liga, mata-mata e modelos híbridos com fase de grupos seguida por fases finais.

Nesta fase inicial, o foco não é implementar regras complexas. A prioridade é construir uma base técnica limpa, com separação clara entre front-end, API, banco de dados e tipos compartilhados.

## Funcionalidades Planejadas

- Criar e gerenciar campeonatos.
- Cadastrar participantes e seus times.
- Definir formato do campeonato.
- Registrar partidas, placares e vencedores.
- Acompanhar status do campeonato.
- Calcular classificação de ligas.
- Gerar confrontos automaticamente.
- Gerenciar fases eliminatórias.
- Suportar disputa de terceiro lugar.
- Consultar histórico de campeonatos finalizados.
- Adicionar autenticação de usuários em uma fase futura.

## Escopo Do MVP

O MVP deve entregar uma primeira versão funcional para uso entre amigos, mantendo as regras simples e evolutivas.

Escopo inicial previsto:

- Cadastro básico de usuários.
- Criação de campeonatos.
- Cadastro de participantes em um campeonato.
- Registro manual de partidas e resultados.
- Listagem de campeonatos.
- Visualização básica de detalhes de um campeonato.
- Estrutura inicial para formatos de liga, mata-mata e liga com mata-mata.

Fora do escopo inicial:

- Autenticação completa.
- Permissões avançadas.
- Geração automática de calendário.
- Regras complexas de desempate.
- Integrações externas.
- Aplicativo mobile.

## Stack Técnica

- **Monorepo:** pnpm workspaces.
- **Orquestração:** Turborepo.
- **Front-end:** Next.js, TypeScript, App Router e Tailwind CSS.
- **Back-end:** Node.js, Express e TypeScript.
- **Banco de dados:** PostgreSQL.
- **ORM:** Prisma.
- **Pacotes internos:** database e shared.
- **Qualidade:** ESLint, TypeScript e Prettier.

## Arquitetura Do Monorepo

```txt
fifa-tournament-manager/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── database/
│   └── shared/
├── docs/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .env.example
└── README.md
```

O monorepo separa aplicações executáveis de pacotes reutilizáveis:

- `apps/` contém aplicações que rodam como serviços.
- `packages/` contém bibliotecas internas compartilhadas.
- `docs/` concentra documentação de produto, regras e API.

Essa organização facilita crescimento futuro sem misturar responsabilidades entre interface, regra de negócio, persistência e contratos compartilhados.

## Apps E Packages

### `apps/web`

Aplicação front-end em Next.js.

Responsabilidades:

- Exibir a interface do produto.
- Consumir a API futuramente.
- Manter componentes e páginas da experiência web.
- Evitar regras de negócio complexas no cliente.

Rotas e telas iniciais:

- Página inicial com apresentação do produto.
- Botões visuais para criação e listagem de campeonatos, ainda sem fluxo real.

### `apps/api`

API em Node.js com Express.

Responsabilidades:

- Concentrar regras de negócio do campeonato.
- Expor rotas HTTP para o front-end.
- Validar entradas e coordenar persistência.
- Servir como camada principal de aplicação.

Rotas iniciais:

- `GET /health`: retorna o status básico da API.

### `packages/database`

Pacote responsável pela integração com Prisma e PostgreSQL.

Responsabilidades:

- Manter o `schema.prisma`.
- Gerar e exportar o Prisma Client.
- Centralizar modelos iniciais do domínio.
- Preparar migrations e acesso ao banco.

Modelos iniciais:

- `User`
- `Tournament`
- `Participant`
- `Match`

### `packages/shared`

Pacote para tipos, enums e contratos compartilhados entre apps.

Responsabilidades:

- Evitar duplicação de enums.
- Compartilhar tipos comuns entre web, API e futuros pacotes.
- Manter contratos simples e independentes de framework.

### `docs`

Documentação complementar do projeto.

Arquivos iniciais:

- `docs/requirements.md`: requisitos do produto.
- `docs/business-rules.md`: regras de negócio planejadas.
- `docs/api-routes.md`: rotas implementadas e planejadas.

## Comandos Principais

Instalar dependências:

```bash
pnpm install
```

Rodar todos os apps em desenvolvimento:

```bash
pnpm dev
```

Gerar build:

```bash
pnpm build
```

Executar lint:

```bash
pnpm lint
```

Validar TypeScript:

```bash
pnpm typecheck
```

Formatar arquivos:

```bash
pnpm format
```

Gerar Prisma Client:

```bash
pnpm db:generate
```

Executar migration em desenvolvimento:

```bash
pnpm db:migrate
```

Abrir Prisma Studio:

```bash
pnpm db:studio
```

## Endpoints Da API

### Health check

- `GET /health`: retorna o status da API.

### Campeonatos

- `POST /tournaments`: cria um campeonato.
- `GET /tournaments`: lista campeonatos.
- `GET /tournaments/:id`: busca um campeonato por ID.
- `PATCH /tournaments/:id`: atualiza dados básicos de um campeonato.
- `DELETE /tournaments/:id`: remove fisicamente um campeonato.

Validações iniciais:

- `name` é obrigatório.
- `format` é obrigatório.
- `format` aceita `LEAGUE`, `KNOCKOUT` ou `LEAGUE_KNOCKOUT`.
- `status` inicial é sempre `DRAFT`.
- `qualifiedCount` é obrigatório quando `format` for `LEAGUE_KNOCKOUT`.
- `qualifiedCount` aceita apenas `2`, `4`, `8` ou `16`.

## Variáveis De Ambiente

Crie um arquivo `.env` na raiz com base no `.env.example`.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fifa_tournament_manager?schema=public"
PORT=3333
NODE_ENV=development
NEXT_PUBLIC_API_URL="http://localhost:3333"
```

Descrição das variáveis:

- `DATABASE_URL`: URL de conexão com o PostgreSQL usada pelo Prisma.
- `PORT`: porta da API Express.
- `NODE_ENV`: ambiente de execução.
- `NEXT_PUBLIC_API_URL`: URL pública da API consumida pelo front-end.

## Ambiente Local

Depois de instalar as dependências e configurar o `.env`, rode:

```bash
pnpm dev
```

URLs esperadas:

- Web: `http://localhost:3000`
- API: `http://localhost:3333`
- Health check: `http://localhost:3333/health`

## Banco De Dados Local Com Docker

O projeto possui um `docker-compose.yml` na raiz para subir um PostgreSQL local e um Adminer opcional para administração visual do banco.

### Subir o banco

```bash
pnpm docker:up
```

Esse comando inicia os containers em background.

### Parar o banco

```bash
pnpm docker:down
```

Esse comando para e remove os containers. O volume do PostgreSQL continua preservado.

### Ver logs do PostgreSQL

```bash
pnpm docker:logs
```

### Reiniciar containers

```bash
pnpm docker:restart
```

### Credenciais locais

As credenciais abaixo são apenas para desenvolvimento:

- Host: `localhost`
- Porta: `5432`
- Database: `fifa_tournament`
- Usuário: `fifa_user`
- Senha: `fifa_password`

URL usada pelo Prisma:

```env
DATABASE_URL="postgresql://fifa_user:fifa_password@localhost:5432/fifa_tournament?schema=public"
```

### Adminer

Com os containers em execução, acesse:

```txt
http://localhost:8080
```

Dados de acesso:

- Sistema: `PostgreSQL`
- Servidor: `postgres`
- Usuário: `fifa_user`
- Senha: `fifa_password`
- Base de dados: `fifa_tournament`

### Prisma

Gerar Prisma Client:

```bash
pnpm db:generate
```

Executar migrations:

```bash
pnpm db:migrate
```

Abrir Prisma Studio:

```bash
pnpm db:studio
```

Resetar banco local:

```bash
pnpm db:reset
```

Mais detalhes estão em [Ambiente de desenvolvimento](./docs/development-environment.md).

## Roadmap Por Fases

### Fase 1: Fundação Técnica

- Configurar monorepo.
- Configurar Next.js, Express, Prisma e packages internos.
- Criar documentação inicial.
- Definir modelos iniciais do banco.

### Fase 2: MVP Manual

- Criar CRUD de campeonatos.
- Criar CRUD de participantes.
- Registrar partidas manualmente.
- Listar campeonatos e detalhes.
- Exibir status básico do campeonato.

### Fase 3: Regras De Liga

- Calcular tabela de classificação.
- Registrar vitórias, empates, derrotas e saldo de gols.
- Definir critérios iniciais de desempate.
- Exibir ranking dos participantes.

### Fase 4: Mata-Mata

- Criar confrontos eliminatórios.
- Registrar vencedor de cada partida.
- Conectar partidas por progressão.
- Suportar final e disputa de terceiro lugar.

### Fase 5: Produto Mais Completo

- Adicionar autenticação.
- Melhorar permissões por dono do campeonato.
- Criar histórico de campeonatos.
- Melhorar experiência visual.
- Adicionar testes automatizados.

## Próximos Passos De Desenvolvimento

1. Criar migrations iniciais do Prisma.
2. Conectar a API ao pacote `database`.
3. Criar módulos reais para campeonatos e participantes.
4. Definir DTOs e validações de entrada.
5. Implementar primeiras rotas REST do MVP.
6. Criar telas de listagem e criação no front-end.
7. Adicionar testes para regras críticas conforme elas surgirem.

## Documentação Complementar

- [Requisitos](./docs/requirements.md)
- [Regras de negócio](./docs/business-rules.md)
- [Rotas da API](./docs/api-routes.md)
- [Ambiente de desenvolvimento](./docs/development-environment.md)
