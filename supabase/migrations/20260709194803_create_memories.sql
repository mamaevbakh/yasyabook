create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  image_url text not null unique,
  caption text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists memories_created_at_idx
on public.memories (created_at desc);

alter table public.memories enable row level security;

grant select, insert, update, delete on table public.memories to anon;

drop policy if exists "Anonymous visitors can read memories" on public.memories;
drop policy if exists "Anonymous visitors can create memories" on public.memories;
drop policy if exists "Anonymous visitors can update memories" on public.memories;
drop policy if exists "Anonymous visitors can delete memories" on public.memories;

create policy "Anonymous visitors can read memories"
on public.memories for select
to anon
using (true);

create policy "Anonymous visitors can create memories"
on public.memories for insert
to anon
with check (true);

create policy "Anonymous visitors can update memories"
on public.memories for update
to anon
using (true)
with check (true);

create policy "Anonymous visitors can delete memories"
on public.memories for delete
to anon
using (true);

insert into public.memories (image_url, caption, created_at) values
  ('/yasya/1.jpeg', '', now() - interval '2 days'),
  ('/yasya/2.jpeg', '', now() - interval '1 day'),
  ('/yasya/3.jpeg', '', now())
on conflict (image_url) do nothing;

insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

drop policy if exists "Anonymous visitors can read memory photos" on storage.objects;
drop policy if exists "Anonymous visitors can upload memory photos" on storage.objects;
drop policy if exists "Anonymous visitors can update memory photos" on storage.objects;
drop policy if exists "Anonymous visitors can delete memory photos" on storage.objects;

create policy "Anonymous visitors can read memory photos"
on storage.objects for select
to anon
using (bucket_id = 'memories');

create policy "Anonymous visitors can upload memory photos"
on storage.objects for insert
to anon
with check (bucket_id = 'memories');

create policy "Anonymous visitors can update memory photos"
on storage.objects for update
to anon
using (bucket_id = 'memories')
with check (bucket_id = 'memories');

create policy "Anonymous visitors can delete memory photos"
on storage.objects for delete
to anon
using (bucket_id = 'memories');
