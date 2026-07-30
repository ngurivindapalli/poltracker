-- Politeia / PolTracker — Supabase schema
-- Cloud accounts + database-backed comments.
--
-- Paste this entire file into the Supabase SQL Editor (SQL Editor -> New query)
-- and run it once. It is safe to re-run: objects are created with
-- "if not exists" / "create or replace" where possible.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- profiles: public-facing user info, 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- comments: threaded comments attached to any entity (politician, leader, country, ...)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  parent_id uuid references public.comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- comment_likes: one row per (comment, user)
create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

-- ---------------------------------------------------------------------------
-- updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists comments_entity_idx
  on public.comments (entity_type, entity_id, created_at desc);
create index if not exists comments_parent_idx
  on public.comments (parent_id);
create index if not exists comments_user_idx
  on public.comments (user_id);
create index if not exists comment_likes_comment_idx
  on public.comment_likes (comment_id);
create index if not exists profiles_username_idx
  on public.profiles (username);

-- ---------------------------------------------------------------------------
-- Auto-create a profile when a new auth user signs up
-- ---------------------------------------------------------------------------
-- Uses raw_user_meta_data (set on sign up) when available, otherwise falls back
-- to the email prefix. Usernames must be unique, so on collision we append a
-- short random suffix.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email_prefix text;
  base_username text;
  final_username text;
  meta_display_name text;
  meta_username text;
begin
  email_prefix := split_part(coalesce(new.email, 'user'), '@', 1);

  meta_display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  meta_username := nullif(trim(coalesce(new.raw_user_meta_data ->> 'username', '')), '');

  -- Build a sanitized base username (lowercase, allowed chars only).
  base_username := lower(coalesce(meta_username, email_prefix));
  base_username := regexp_replace(base_username, '[^a-z0-9_-]', '', 'g');
  if base_username = '' then
    base_username := 'user';
  end if;

  final_username := base_username;
  -- Resolve collisions with a short random suffix.
  if exists (select 1 from public.profiles where username = final_username) then
    final_username := base_username || '-' || substr(md5(random()::text), 1, 4);
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    final_username,
    coalesce(meta_display_name, email_prefix)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;

-- profiles policies
drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- comments policies
drop policy if exists "Comments are readable by everyone" on public.comments;
create policy "Comments are readable by everyone"
  on public.comments for select
  using (true);

drop policy if exists "Authenticated users can insert their own comments" on public.comments;
create policy "Authenticated users can insert their own comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own comments" on public.comments;
create policy "Users can update their own comments"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- comment_likes policies
drop policy if exists "Likes are readable by everyone" on public.comment_likes;
create policy "Likes are readable by everyone"
  on public.comment_likes for select
  using (true);

drop policy if exists "Authenticated users can insert their own likes" on public.comment_likes;
create policy "Authenticated users can insert their own likes"
  on public.comment_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own likes" on public.comment_likes;
create policy "Users can delete their own likes"
  on public.comment_likes for delete
  using (auth.uid() = user_id);
