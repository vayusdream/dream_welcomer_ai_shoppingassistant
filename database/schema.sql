-- Minimal catalog table for dream_welcomer.
-- Seed data is intentionally not stored here; the app falls back to mock data
-- when PostgreSQL is unavailable or the table is empty.
create table if not exists products (
  id text primary key,
  name text not null,
  category text not null,
  category_label text not null,
  price integer not null,
  currency text not null default 'CNY',
  rating real not null default 0,
  reviews integer not null default 0,
  stock integer not null default 0,
  image text not null,
  summary text not null,
  badges jsonb not null default '[]',
  tags jsonb not null default '[]',
  specs jsonb not null default '{}'
);

create index if not exists products_category_idx on products (category);
create index if not exists products_rating_idx on products (rating desc);
