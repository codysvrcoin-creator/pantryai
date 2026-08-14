-- =========================================================
-- PANTRYAI · SUPABASE SCHEMA (personal use, no login)
-- =========================================================
-- Run this entire file in: Supabase Dashboard > SQL Editor > New query
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. PREFERENCES (single row: people, budget, currency)
-- ---------------------------------------------------------
create table if not exists preferences (
  id uuid primary key default uuid_generate_v4(),
  people integer not null default 2,
  weekly_budget numeric(10,2) not null default 60,
  currency text not null default 'EUR',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 2. NUTRITION GOALS (single row: daily targets)
-- ---------------------------------------------------------
create table if not exists nutrition_goals (
  id uuid primary key default uuid_generate_v4(),
  calories integer not null default 2000,
  protein_g integer not null default 120,
  carbs_g integer not null default 220,
  fat_g integer not null default 65,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 3. PANTRY ITEMS (inventory: fridge / pantry / freezer)
-- ---------------------------------------------------------
create table if not exists pantry_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null default 'other',
  quantity numeric(10,2) not null default 0,
  unit text not null default 'u',
  location text not null default 'pantry' check (location in ('fridge','pantry','freezer')),
  purchase_date date default current_date,
  expiration_date date,
  is_empty boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pantry_items_location on pantry_items(location);
create index if not exists idx_pantry_items_expiration on pantry_items(expiration_date);

-- ---------------------------------------------------------
-- 4. PANTRY TRANSACTIONS (history: add / consume / discard)
-- ---------------------------------------------------------
create table if not exists pantry_transactions (
  id uuid primary key default uuid_generate_v4(),
  pantry_item_id uuid references pantry_items(id) on delete cascade,
  type text not null check (type in ('add','consume','discard','adjust')),
  quantity numeric(10,2) not null,
  unit text not null default 'u',
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pantry_tx_item on pantry_transactions(pantry_item_id);

-- ---------------------------------------------------------
-- 5. RECIPES (base recipes, scalable by servings)
-- ---------------------------------------------------------
create table if not exists recipes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  servings_base integer not null default 2,
  instructions text,
  prep_minutes integer default 10,
  cook_minutes integer default 20,
  tags text[] default '{}',
  calories_per_serving integer,
  protein_per_serving numeric(6,1),
  carbs_per_serving numeric(6,1),
  fat_per_serving numeric(6,1),
  estimated_cost numeric(10,2),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 6. RECIPE INGREDIENTS (ingredients -> linked to pantry)
-- ---------------------------------------------------------
create table if not exists recipe_ingredients (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  name text not null,
  quantity numeric(10,2) not null,
  unit text not null default 'u',
  pantry_category text default 'other',
  optional boolean not null default false
);

create index if not exists idx_recipe_ingredients_recipe on recipe_ingredients(recipe_id);

-- ---------------------------------------------------------
-- 7. MEAL PLANS (weekly planning)
-- ---------------------------------------------------------
create table if not exists meal_plans (
  id uuid primary key default uuid_generate_v4(),
  week_start_date date not null,
  created_at timestamptz not null default now(),
  unique(week_start_date)
);

create table if not exists meal_plan_entries (
  id uuid primary key default uuid_generate_v4(),
  meal_plan_id uuid not null references meal_plans(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete set null,
  date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  servings integer not null default 2
);

create index if not exists idx_meal_plan_entries_plan on meal_plan_entries(meal_plan_id);
create index if not exists idx_meal_plan_entries_date on meal_plan_entries(date);

-- ---------------------------------------------------------
-- 8. GROCERY LISTS (weekly shopping list)
-- ---------------------------------------------------------
create table if not exists grocery_lists (
  id uuid primary key default uuid_generate_v4(),
  week_start_date date not null,
  status text not null default 'open' check (status in ('open','completed')),
  created_at timestamptz not null default now(),
  unique(week_start_date)
);

create table if not exists grocery_list_items (
  id uuid primary key default uuid_generate_v4(),
  grocery_list_id uuid not null references grocery_lists(id) on delete cascade,
  name text not null,
  quantity numeric(10,2) not null default 1,
  unit text not null default 'u',
  category text default 'other',
  estimated_price numeric(10,2) default 0,
  is_checked boolean not null default false,
  source text not null default 'manual' check (source in ('manual','recipe','restock')),
  created_at timestamptz not null default now()
);

create index if not exists idx_grocery_items_list on grocery_list_items(grocery_list_id);

-- ---------------------------------------------------------
-- 9. RECEIPTS (real purchase receipts -> actual spend)
-- ---------------------------------------------------------
create table if not exists receipts (
  id uuid primary key default uuid_generate_v4(),
  store_name text,
  purchase_date date not null default current_date,
  total_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists receipt_items (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  name text not null,
  quantity numeric(10,2) not null default 1,
  unit text not null default 'u',
  unit_price numeric(10,2),
  total_price numeric(10,2),
  pantry_item_id uuid references pantry_items(id) on delete set null
);

create index if not exists idx_receipt_items_receipt on receipt_items(receipt_id);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) — "single-user" mode
-- =========================================================
-- There's no login. The app uses Supabase's "anon" key, which is protected
-- because only you know your app's URL. We still enable RLS as a good
-- practice, and create a fully permissive (allow-all) policy for the
-- anon role, since there's no concept of "another user" in this app.

alter table preferences enable row level security;
alter table nutrition_goals enable row level security;
alter table pantry_items enable row level security;
alter table pantry_transactions enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table meal_plans enable row level security;
alter table meal_plan_entries enable row level security;
alter table grocery_lists enable row level security;
alter table grocery_list_items enable row level security;
alter table receipts enable row level security;
alter table receipt_items enable row level security;

create policy "allow all - preferences" on preferences for all using (true) with check (true);
create policy "allow all - nutrition_goals" on nutrition_goals for all using (true) with check (true);
create policy "allow all - pantry_items" on pantry_items for all using (true) with check (true);
create policy "allow all - pantry_transactions" on pantry_transactions for all using (true) with check (true);
create policy "allow all - recipes" on recipes for all using (true) with check (true);
create policy "allow all - recipe_ingredients" on recipe_ingredients for all using (true) with check (true);
create policy "allow all - meal_plans" on meal_plans for all using (true) with check (true);
create policy "allow all - meal_plan_entries" on meal_plan_entries for all using (true) with check (true);
create policy "allow all - grocery_lists" on grocery_lists for all using (true) with check (true);
create policy "allow all - grocery_list_items" on grocery_list_items for all using (true) with check (true);
create policy "allow all - receipts" on receipts for all using (true) with check (true);
create policy "allow all - receipt_items" on receipt_items for all using (true) with check (true);

-- =========================================================
-- INITIAL DATA (a single row of preferences and goals)
-- =========================================================
insert into preferences (people, weekly_budget, currency)
select 2, 60, 'EUR'
where not exists (select 1 from preferences);

insert into nutrition_goals (calories, protein_g, carbs_g, fat_g)
select 2000, 120, 220, 65
where not exists (select 1 from nutrition_goals);
