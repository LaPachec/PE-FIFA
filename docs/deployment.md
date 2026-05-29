# Deploy em producao

Este guia prepara o FIFA Tournament Manager para deploy separado:

- Front-end Next.js na Vercel.
- API Node.js/Express no Render.
- PostgreSQL no Supabase.

## Variaveis de ambiente

### API no Render

Configure no servico da API:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="gere-um-segredo-forte"
NODE_ENV=production
CORS_ORIGIN="https://seu-front.vercel.app,https://seu-front-git-master-usuario.vercel.app"
```

O `PORT` e definido automaticamente pelo Render. Localmente, a API usa fallback para `3333`.
`CORS_ORIGIN` aceita multiplas origens separadas por virgula. Nao use espacos como parte das URLs; a API aplica `trim`, mas o ideal e manter a lista limpa.

### Front-end na Vercel

Configure no projeto web:

```env
NEXT_PUBLIC_API_URL="https://sua-api.onrender.com"
NEXT_PUBLIC_APP_URL="https://seu-front.vercel.app"
```

`NEXT_PUBLIC_APP_URL` e usado para gerar links publicos de campeonato e links de convite.

## Banco PostgreSQL no Supabase

1. Crie um projeto no Supabase.
2. Acesse as configuracoes de banco e copie a connection string do PostgreSQL.
3. Substitua usuario, senha, host, porta e database.
4. Use a URL final em `DATABASE_URL` no Render.

Exemplo:

```env
DATABASE_URL="postgresql://postgres:SENHA@db.PROJECT.supabase.co:5432/postgres?schema=public"
```

Se o Supabase recomendar SSL na connection string do seu projeto, mantenha os parametros fornecidos pela propria plataforma.

## Prisma em producao

Antes de publicar a API pela primeira vez, execute as migrations no banco de producao.

Usando as variaveis de ambiente configuradas localmente:

```bash
pnpm db:generate
pnpm db:deploy
```

No Render, tambem e possivel rodar o comando em um job/manual shell usando a mesma `DATABASE_URL` de producao:

```bash
pnpm db:deploy
```

Use `pnpm db:migrate` apenas em desenvolvimento local. Em producao, use `pnpm db:deploy`.

## Deploy da API no Render pelo painel

Crie um Web Service apontando para o repositorio.

Configuracao recomendada para monorepo:

- Root Directory: raiz do repositorio.
- Build Command: `pnpm install --frozen-lockfile && pnpm db:generate && pnpm build:api`
- Start Command: `pnpm start:api`
- Health Check Path: `/health`

Variaveis obrigatorias:

- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`
- `CORS_ORIGIN=https://seu-front.vercel.app,https://seu-front-git-master-usuario.vercel.app`

O `PORT` nao precisa ser configurado manualmente. O Render injeta essa variavel no ambiente do servico.

Em producao, a API aceita apenas origens listadas em `CORS_ORIGIN`. Chamadas sem header `Origin`, como health checks do Render, `curl` e chamadas server-to-server, continuam permitidas.

## Deploy da API no Render com `render.yaml`

O repositorio tambem possui um `render.yaml` opcional para facilitar a criacao do Web Service da API.

Ele configura:

- Runtime Node.
- Root Directory na raiz do monorepo.
- Build Command: `corepack enable && pnpm install --frozen-lockfile && pnpm db:generate && pnpm build:api`
- Start Command: `pnpm start:api`
- Health Check Path: `/health`
- `NODE_ENV=production`

As variaveis abaixo ficam com `sync: false` e devem ser preenchidas manualmente no painel do Render:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`

Use `CORS_ORIGIN` com a URL final do front na Vercel. Se tambem quiser permitir previews ou o dominio de branch da Vercel, informe todas as origens separadas por virgula:

```env
CORS_ORIGIN="https://pe-fifa-web.vercel.app,https://pe-fifa-web-git-master-lapachec.vercel.app"
```

Quando uma origem nao listada tentar chamar a API, o Render registrara um log como `Blocked CORS request from origin: https://exemplo.com`, sem expor variaveis sensiveis.

Depois do deploy, valide:

```bash
curl https://sua-api.onrender.com/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "fifa-tournament-manager-api"
}
```

## Deploy do front-end na Vercel pelo painel

Crie um projeto na Vercel apontando para o mesmo repositorio.

Configuracao recomendada para monorepo:

- Root Directory: `apps/web`
- Framework Preset: Next.js
- Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- Build Command: `cd ../.. && pnpm build:web`

Variaveis obrigatorias:

- `NEXT_PUBLIC_API_URL=https://sua-api.onrender.com`
- `NEXT_PUBLIC_APP_URL=https://seu-front.vercel.app`

Se preferir manter o Root Directory na raiz do repositorio, use:

- Build Command: `pnpm build:web`

Nao ha `vercel.json` obrigatorio neste projeto. Para este monorepo, a configuracao mais clara e definir o Root Directory como `apps/web` no painel da Vercel e manter as variaveis de ambiente do front no proprio projeto da Vercel.

## Comandos de build e start por app

API:

```bash
pnpm --filter @fifa-tournament-manager/api build
pnpm --filter @fifa-tournament-manager/api start
```

Web:

```bash
pnpm --filter @fifa-tournament-manager/web build
pnpm --filter @fifa-tournament-manager/web start
```

## Comandos uteis do monorepo

```bash
pnpm build:web
pnpm build:api
pnpm start:api
pnpm db:generate
pnpm db:deploy
```

Tambem e possivel chamar pacotes diretamente:

```bash
pnpm --filter @fifa-tournament-manager/web build
pnpm --filter @fifa-tournament-manager/api build
pnpm --filter @fifa-tournament-manager/api start
pnpm --filter @fifa-tournament-manager/database deploy
```

## Validacao do fluxo em producao

1. Acesse `https://sua-api.onrender.com/health`.
2. Acesse o front na Vercel.
3. Crie uma conta.
4. Crie um campeonato.
5. Copie e abra o link de convite em uma janela anonima.
6. Inscreva um participante e aprove no painel privado.
7. Inicie o campeonato.
8. Registre resultados, incluindo penaltis em mata-mata quando necessario.
9. Confira classificacao, estatisticas, campeao e pagina publica.

## Checklist antes de compartilhar

- `CORS_ORIGIN` aponta para todos os dominios da Vercel que devem chamar a API, separados por virgula.
- `NEXT_PUBLIC_API_URL` aponta para a API real do Render.
- `NEXT_PUBLIC_APP_URL` aponta para o front real da Vercel.
- `DATABASE_URL` no Render aponta para o banco Supabase correto.
- `JWT_SECRET` foi configurado com um valor forte e privado.
- Migrations foram aplicadas no Supabase.
- `/health` responde em producao.
- Login e cadastro funcionam no front publicado.
- Criacao de campeonato funciona com usuario autenticado.
- Fluxos publicos funcionam sem login.
- Pagina publica de campeonato abre sem token.
- Paginas privadas redirecionam usuarios sem token para `/login`.
