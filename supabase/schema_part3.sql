-- =========================================================
-- PANTRYAI · MIGRATION PART 3 (plan + list backup)
-- =========================================================
-- Run this in: Supabase Dashboard > SQL Editor > New query
-- (in addition to the supabase/schema.sql you already ran in Part 1)
-- =========================================================

create table if not exists app_state_backup (
  id uuid primary key default uuid_generate_v4(),
  week_plan jsonb,
  grocery_items jsonb,
  updated_at timestamptz not null default now()
);

alter table app_state_backup enable row level security;

create policy "allow all - app_state_backup" on app_state_backup
  for all using (true) with check (true);
