# Ambiente de desenvolvimento

Este documento descreve a configuracao local do banco de dados para o FIFA Tournament Manager.

## Banco de dados local

O projeto usa PostgreSQL em desenvolvimento por meio do Docker Compose.

Servicos configurados:

- `postgres`: banco PostgreSQL 16 usado pela API e pelo Prisma.
- `adminer`: interface web opcional para administracao visual do banco.

## Como subir o banco

Na raiz do monorepo, execute:

```bash
pnpm docker:up
```

Esse comando cria os containers em background e mantem os dados em um volume Docker persistente.

## Como parar o banco

```bash
pnpm docker:down
```

Esse comando para e remove os containers, mas preserva o volume de dados do PostgreSQL.

## Logs do Postgres

```bash
pnpm docker:logs
```

## Reiniciar containers

```bash
pnpm docker:restart
```

## Credenciais locais

As credenciais abaixo sao apenas para desenvolvimento local:

- Host: `localhost`
- Porta no host: `5433`
- Porta interna do container: `5432`
- Database: `fifa_tournament`
- Usuario: `fifa_user`
- Senha: `fifa_password`

URL de conexao:

```env
DATABASE_URL="postgresql://fifa_user:fifa_password@localhost:5433/fifa_tournament?schema=public"
```

## Adminer

Quando os containers estiverem em execucao, acesse:

```txt
http://localhost:8080
```

Use os dados:

- Sistema: `PostgreSQL`
- Servidor: `postgres`
- Usuario: `fifa_user`
- Senha: `fifa_password`
- Base de dados: `fifa_tournament`

## Prisma

Gerar Prisma Client:

```bash
pnpm db:generate
```

Executar migrations em desenvolvimento:

```bash
pnpm db:migrate
```

Abrir Prisma Studio:

```bash
pnpm db:studio
```

Resetar o banco local:

```bash
pnpm db:reset
```

Use `db:reset` com cuidado, pois ele remove os dados do banco local.
