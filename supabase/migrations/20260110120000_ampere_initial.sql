-- AMPERE.OS — schema inicial (ver PRD.md §4)
-- Aplicar no Supabase: SQL Editor → colar → Run, ou `supabase db push` com CLI ligado ao projeto.

-- ---------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'operator'
    check (role in ('operator', 'guardian', 'admin')),
  wallet_public_key text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil do utilizador; RLS: só a própria linha.';

-- ---------------------------------------------------------------------------
-- Gêmeos (espelho off-chain; verdade on-chain na Solana)
-- ---------------------------------------------------------------------------
create table public.twins (
  id uuid primary key default gen_random_uuid (),
  twin_id text not null unique,
  content_hash text not null,
  ai_score double precision not null
    check (ai_score >= 0 and ai_score <= 1),
  votes int not null default 0 check (votes >= 0),
  is_confirmed boolean not null default false,
  solana_twin_pda text,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index twins_owner_id_idx on public.twins (owner_id);
create index twins_twin_id_idx on public.twins (twin_id);

comment on table public.twins is 'Espelho de twins; votos/confirmado podem ser sincronizados da chain (MVP: update pelo dono).';

-- ---------------------------------------------------------------------------
-- Eventos de auditoria
-- ---------------------------------------------------------------------------
create table public.validation_events (
  id bigserial primary key,
  twin_uuid uuid not null references public.twins (id) on delete cascade,
  event_type text not null
    check (event_type in ('registered', 'vote', 'confirmed', 'rejected')),
  payload jsonb,
  created_at timestamptz not null default now ()
);

create index validation_events_twin_uuid_idx
  on public.validation_events (twin_uuid);

-- ---------------------------------------------------------------------------
-- Trigger: updated_at em twins
-- ---------------------------------------------------------------------------
create or replace function public.set_twins_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger twins_set_updated_at
  before update on public.twins
  for each row
  execute function public.set_twins_updated_at ();

-- ---------------------------------------------------------------------------
-- Trigger: criar profile ao registar utilizador
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    'operator'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user ();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.twins enable row level security;
alter table public.validation_events enable row level security;

-- profiles: próprio utilizador
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid () = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid () = id);

-- twins: leitura para autenticados (MVP hackathon; apertar por tenant depois)
create policy "twins_select_authenticated"
  on public.twins for select
  to authenticated
  using (true);

create policy "twins_insert_own"
  on public.twins for insert
  to authenticated
  with check (owner_id = auth.uid ());

-- MVP: dono atualiza espelho (ex.: após tx Solana); produção pode ser só service_role
create policy "twins_update_own"
  on public.twins for update
  to authenticated
  using (owner_id = auth.uid ())
  with check (owner_id = auth.uid ());

-- validation_events: dono do twin lê e insere (MVP; produção preferir Edge + service_role)
create policy "validation_events_select_twin_owner"
  on public.validation_events for select
  to authenticated
  using (
    exists (
      select 1 from public.twins t
      where t.id = validation_events.twin_uuid
        and t.owner_id = auth.uid ()
    )
  );

create policy "validation_events_insert_twin_owner"
  on public.validation_events for insert
  to authenticated
  with check (
    exists (
      select 1 from public.twins t
      where t.id = twin_uuid
        and t.owner_id = auth.uid ()
    )
  );
