# dream_welcomer

Small e-commerce AI shopping guide built with Next.js, React, TypeScript, Tailwind CSS, LangChain, Zod, PostgreSQL, and pnpm.

demo：https://dream-welcomer-ai-shoppingassistant.vercel.app/

## Stack

- Next.js `15.5.9`
- React `19.2.3`
- TypeScript `5.9.3`
- Tailwind CSS `4.1.18`
- LangChain `@langchain/core@1.2.0` and `@langchain/openai@1.5.1`
- Zod `3.25.76`
- PostgreSQL via `pg@8.22.0`
- pnpm `9.15.9`

## Features

- Product list
- AI shopping Q&A
- Natural language filtering
- Product comparison
- Cart
- Wishlist
- Mock order lookup

## Run

```bash
corepack prepare pnpm@9.15.9 --activate
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

If Corepack cannot activate pnpm locally:

```bash
npm install -g pnpm@9.15.9
pnpm install
pnpm dev
```

## Environment

Copy `.env.example` to `.env`.

The app runs with mock data by default. Set `DATABASE_URL` to connect PostgreSQL, and set `OPENAI_API_KEY` to let LangChain call an OpenAI model for structured filter extraction. Without an API key, the assistant uses a local deterministic parser.

## PostgreSQL

The browser demo works without a database. To use PostgreSQL, create a database, apply `database/schema.sql`, then set `DATABASE_URL` in `.env`.

`/api/products`, the home page, and `/api/assistant` all use the same catalog source: PostgreSQL when available, otherwise mock data.

## Verify

```bash
pnpm check
pnpm build
```
