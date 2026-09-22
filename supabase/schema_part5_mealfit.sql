-- =========================================================
-- MEALFIT · MIGRATION (rebrand: vegan/high-protein/low-cal
-- system + meal-prep "days off" + saved/imported recipes)
-- =========================================================
-- Run this in: Supabase Dashboard > SQL Editor > New query
-- (in addition to schema.sql, schema_part3.sql and
-- schema_part4.sql you already ran)
-- =========================================================

-- ---------------------------------------------------------
-- 1. Meal-prep: how many days/week the user actively cooks
-- ---------------------------------------------------------
alter table preferences
  add column if not exists cook_days_per_week integer not null default 4;

-- ---------------------------------------------------------
-- 2. Recipe import (saved from social media / pasted text)
-- ---------------------------------------------------------
alter table recipes
  add column if not exists source text not null default 'manual',
  add column if not exists source_url text,
  add column if not exists steps jsonb not null default '[]'::jsonb,
  add column if not exists utensils jsonb not null default '[]'::jsonb,
  add column if not exists was_adapted boolean not null default false,
  add column if not exists adaptation_note text,
  add column if not exists created_at timestamptz not null default now();

alter table recipes
  drop constraint if exists recipes_source_check;
alter table recipes
  add constraint recipes_source_check check (source in ('manual', 'import'));

-- ---------------------------------------------------------
-- 3. MealFit's default nutritional identity: vegan, high-
--    protein, calorie-conscious, athletic. Update the
--    existing single row (seeded by schema.sql) in place.
-- ---------------------------------------------------------
update nutrition_goals
set calories = 1900,
    protein_g = 150,
    carbs_g = 190,
    fat_g = 58,
    updated_at = now()
where true;

insert into nutrition_goals (calories, protein_g, carbs_g, fat_g)
select 1900, 150, 190, 58
where not exists (select 1 from nutrition_goals);
