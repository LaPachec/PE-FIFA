# Deploy

Guia simples para publicar o FIFA Tournament Manager para uso com amigos.

## Servicos necessarios

- Front-end Next.js em uma plataforma como Vercel.
- API Node.js/Express em uma plataforma que suporte processos Node.
- PostgreSQL gerenciado.

## Variaveis de ambiente

Configure na API:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
PORT=3333
NODE_ENV=production
JWT_SECRET="use-um-segredo-forte"
```

Configure no front-end:

```env
NEXT_PUBLIC_API_URL="https://sua-api.exemplo.com"
NEXT_PUBLIC_APP_URL="https://seu-front.exemplo.com"
```

`NEXT_PUBLIC_APP_URL` e usado para copiar links publicos e links de convite com o dominio correto.

## Banco de dados

Depois de configurar `DATABASE_URL`, execute:

```bash
pnpm db:generate
pnpm db:migrate
```

## Build

Na raiz do monorepo:

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build
```

## Checklist antes de compartilhar

- Criar uma conta.
- Criar um campeonato de teste.
- Copiar e abrir o link de convite em janela anonima.
- Inscrever um participante e aprovar.
- Iniciar o campeonato.
- Registrar resultados, incluindo um mata-mata decidido por penaltis.
- Abrir a pagina publica sem login.
