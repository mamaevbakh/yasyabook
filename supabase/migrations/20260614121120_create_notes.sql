create extension if not exists pgcrypto;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_updated_at_idx
on public.notes (updated_at desc);

create or replace function public.set_notes_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;

create trigger notes_set_updated_at
before update on public.notes
for each row
execute function public.set_notes_updated_at();

alter table public.notes enable row level security;

grant select, insert, update, delete on table public.notes to anon;

drop policy if exists "Anonymous visitors can read notes" on public.notes;
drop policy if exists "Anonymous visitors can create notes" on public.notes;
drop policy if exists "Anonymous visitors can update notes" on public.notes;
drop policy if exists "Anonymous visitors can delete notes" on public.notes;

create policy "Anonymous visitors can read notes"
on public.notes for select
to anon
using (true);

create policy "Anonymous visitors can create notes"
on public.notes for insert
to anon
with check (true);

create policy "Anonymous visitors can update notes"
on public.notes for update
to anon
using (true)
with check (true);

create policy "Anonymous visitors can delete notes"
on public.notes for delete
to anon
using (true);
