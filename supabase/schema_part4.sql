-- =========================================================
-- PANTRYAI · MIGRATION (personal price memory)
-- =========================================================
-- Run this in: Supabase Dashboard > SQL Editor > New query
-- (in addition to schema.sql and schema_part3.sql you already ran)
-- =========================================================

create table if not exists price_memory (
  key text primary key, -- normalized product name (unique key)
  display_name text not null,
  last_price numeric not null,
  package_quantity numeric not null,
  package_unit text not null,
  price_per_base_unit numeric, -- €/kg, €/l or €/unit
  base_unit text not null, -- "g" | "ml" | "u"
  store_name text,
  purchase_date date,
  updated_at timestamptz not null default now()
);

alter table price_memory enable row level security;

create policy "allow all - price_memory" on price_memory
  for all using (true) with check (true);
