-- ============================================================================
-- Chorale Divine Providence — Migration initiale
-- Cible : Supabase / PostgreSQL 15+
-- Contenu : enums, tables, relations, fonctions RPC, RLS, triggers, seed minimal
-- Convention : tout en public, mono-chorale, séparation des rôles par RLS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid(), gen_random_bytes()

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
create type app_role         as enum ('chorister', 'admin');
create type account_status   as enum ('pending', 'active', 'refused');
create type pupitre          as enum ('soprano','alto','tenor','basse','instrumentiste','chef_choeur');
create type attendance_status as enum ('present', 'absent');
create type song_category    as enum (
  'entree','ordinaire','psaume','alleluia','pu','offertoire','communion',
  'action_de_grace','mariale','funerailles','esperance','louange','adoration'
);

-- ----------------------------------------------------------------------------
-- 2. PROFILES  (1–1 avec auth.users)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null default '',
  email           text,
  phone           text,
  pupitre         pupitre,
  role            app_role       not null default 'chorister',
  status          account_status not null default 'pending',
  avatar_initials text,
  photo_url       text,
  created_at      timestamptz not null default now()
);

-- Helpers SECURITY DEFINER : contournent la RLS pour éviter la récursion
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active');
$$;

-- Création automatique du profil à l'inscription (métadonnées passées au signUp)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, pupitre, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'pupitre','')::pupitre,
    upper(left(coalesce(new.raw_user_meta_data->>'full_name','?'),1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3. CODES D'INVITATION  (CDP-XXXX, usage unique, 7 jours)
-- ----------------------------------------------------------------------------
create table public.invitation_codes (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used       boolean not null default false,
  used_by    uuid references public.profiles(id) on delete set null,
  used_at    timestamptz
);

-- Génération d'un code CDP-XXXX (charset sans caractères ambigus) — admin only
create or replace function public.generate_invitation()
returns public.invitation_codes language plpgsql security definer set search_path = public as $$
declare
  v_charset constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_suffix text;
  v_code text;
  v_row  public.invitation_codes;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  loop
    select 'CDP-' || string_agg(
      substr(v_charset, 1 + floor(random()*length(v_charset))::int, 1),
      ''
    )
      into v_code
      from generate_series(1,4);
    exit when not exists (select 1 from public.invitation_codes where code = v_code);
  end loop;
  insert into public.invitation_codes(code, created_by)
  values (v_code, auth.uid())
  returning * into v_row;
  return v_row;
end;
$$;
grant execute on function public.generate_invitation() to authenticated;

-- Vérifie (sans consommer) qu'un code est valide. Appelable avant l'inscription.
create or replace function public.check_invitation(p_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.invitation_codes
    where code = p_code and used = false and expires_at > now()
  );
$$;
grant execute on function public.check_invitation(text) to anon, authenticated;

-- Consommation d'un code par un utilisateur fraîchement inscrit (pending) -> active
create or replace function public.redeem_invitation(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id
  from public.invitation_codes
  where code = p_code and used = false and expires_at > now()
  for update;

  if v_id is null then
    raise exception 'INVALID_OR_EXPIRED_CODE';
  end if;

  update public.invitation_codes
     set used = true, used_by = auth.uid(), used_at = now()
   where id = v_id;

  update public.profiles set status = 'active' where id = auth.uid();
end;
$$;
grant execute on function public.redeem_invitation(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. RÉPERTOIRE : SONGS + FAVORIS
-- ----------------------------------------------------------------------------
create table public.songs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  category    song_category not null,
  lyrics      text,            -- texte structuré couplets/refrain
  score_url   text,            -- partition image/PDF (Storage) — optionnel
  audio_url   text,            -- MP3 (Storage) — optionnel
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index on public.songs (category);

create table public.song_favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  song_id uuid references public.songs(id)    on delete cascade,
  primary key (user_id, song_id)
);

-- ----------------------------------------------------------------------------
-- 5. FIL D'ACTUALITÉ : POSTS + COMMENTAIRES + RÉACTIONS
-- ----------------------------------------------------------------------------
create table public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null default '',
  photo_url  text,
  created_at timestamptz not null default now()
);
create index on public.posts (created_at desc);

create table public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create table public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind    text not null default 'like',   -- extensible : like / amen / pray ...
  primary key (post_id, user_id, kind)
);

-- ----------------------------------------------------------------------------
-- 6. AGENDA : EVENTS + PRÉSENCES
-- ----------------------------------------------------------------------------
create table public.events (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  type       text,
  starts_at  timestamptz not null,
  location   text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.events (starts_at);

create table public.event_attendance (
  event_id uuid references public.events(id)   on delete cascade,
  user_id  uuid references public.profiles(id) on delete cascade,
  status   attendance_status not null,
  marked_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Vue d'agrégation présence par pupitre (écran Statistiques)
create or replace view public.stats_attendance_by_pupitre as
  select
    p.pupitre,
    count(*) filter (where a.status = 'present')::int as present_count,
    count(*)::int                                     as total_count,
    round(100.0 * count(*) filter (where a.status = 'present')
          / nullif(count(*),0), 0)::int               as present_pct
  from public.event_attendance a
  join public.profiles p on p.id = a.user_id
  group by p.pupitre;

-- ----------------------------------------------------------------------------
-- 7. ANNONCES / NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table public.announcements (
  id         uuid primary key default gen_random_uuid(),
  audience   text not null default 'all',
  title      text not null,
  message    text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,  -- null = broadcast
  type       text not null,
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 8. CHORISTE DU MOIS
-- ----------------------------------------------------------------------------
create table public.chorist_of_month (
  id         uuid primary key default gen_random_uuid(),
  month      date not null unique,   -- 1er du mois
  user_id    uuid not null references public.profiles(id) on delete cascade,
  motivation text,
  stats      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 9. RÈGLEMENT / BUREAU / AIDE (FAQ + liens)
-- ----------------------------------------------------------------------------
create table public.reglement_articles (
  id         uuid primary key default gen_random_uuid(),
  num        int not null,
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now()
);

create table public.bureau_members (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  role            text not null,   -- Président, Secrétaire, Trésorier, Aumônier...
  phone           text,
  avatar_initials text,
  sort_order      int not null default 0
);

create table public.faq (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  sort_order int not null default 0
);

create table public.help_links (
  id           int primary key default 1 check (id = 1),  -- singleton
  whatsapp_url text,
  email_contact text
);
insert into public.help_links (id) values (1) on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 10. MESSAGERIE (lot 5 — posée dès maintenant)
-- ----------------------------------------------------------------------------
create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  is_group   boolean not null default false,
  title      text,
  created_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id         uuid references public.profiles(id)      on delete cascade,
  primary key (conversation_id, user_id)
);
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index on public.messages (conversation_id, created_at);

create or replace function public.is_conversation_member(p_conversation uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members m
    where m.conversation_id = p_conversation and m.user_id = auth.uid()
  );
$$;

-- ============================================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.invitation_codes    enable row level security;
alter table public.songs               enable row level security;
alter table public.song_favorites      enable row level security;
alter table public.posts               enable row level security;
alter table public.post_comments       enable row level security;
alter table public.post_reactions      enable row level security;
alter table public.events              enable row level security;
alter table public.event_attendance    enable row level security;
alter table public.announcements       enable row level security;
alter table public.notifications       enable row level security;
alter table public.chorist_of_month    enable row level security;
alter table public.reglement_articles  enable row level security;
alter table public.bureau_members      enable row level security;
alter table public.faq                 enable row level security;
alter table public.help_links          enable row level security;
alter table public.conversations       enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages            enable row level security;

-- PROFILES ------------------------------------------------------------------
create policy "profiles self read"    on public.profiles for select using (id = auth.uid());
create policy "profiles members read" on public.profiles for select using (public.is_active_member() and status = 'active');
create policy "profiles admin read"   on public.profiles for select using (public.is_admin());
-- self update SAUF role/status (garde-fous appliqués aussi par trigger ci-dessous)
create policy "profiles self update"  on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin write"  on public.profiles for all    using (public.is_admin()) with check (public.is_admin());

-- Empêche un choriste de modifier son propre role/status
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if new.role is distinct from old.role or new.status is distinct from old.status then
    raise exception 'CANNOT_CHANGE_ROLE_OR_STATUS';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_profile on public.profiles;
create trigger trg_protect_profile before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- INVITATION CODES : admin uniquement (la consommation passe par redeem_invitation)
create policy "invitations admin all" on public.invitation_codes for all
  using (public.is_admin()) with check (public.is_admin());

-- Modèle "contenu partagé" : lecture = membre actif ; écriture = admin
-- SONGS
create policy "songs read"  on public.songs for select using (public.is_active_member());
create policy "songs admin" on public.songs for all    using (public.is_admin()) with check (public.is_admin());
-- FAVORIS : chacun gère les siens
create policy "favs own" on public.song_favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- POSTS : lecture membres ; création = membre actif (auteur = soi) ; edit/suppr = auteur ou admin
create policy "posts read"        on public.posts for select using (public.is_active_member());
create policy "posts insert own"  on public.posts for insert with check (author_id = auth.uid() and public.is_active_member());
create policy "posts update own"  on public.posts for update using (author_id = auth.uid());
create policy "posts delete own"  on public.posts for delete using (author_id = auth.uid() or public.is_admin());

create policy "comments read"       on public.post_comments for select using (public.is_active_member());
create policy "comments insert own" on public.post_comments for insert with check (author_id = auth.uid() and public.is_active_member());
create policy "comments delete own" on public.post_comments for delete using (author_id = auth.uid() or public.is_admin());

create policy "reactions read"     on public.post_reactions for select using (public.is_active_member());
create policy "reactions own"      on public.post_reactions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_active_member());

-- EVENTS + PRÉSENCES
create policy "events read"  on public.events for select using (public.is_active_member());
create policy "events admin" on public.events for all    using (public.is_admin()) with check (public.is_admin());
create policy "attendance read"     on public.event_attendance for select using (public.is_active_member());
create policy "attendance own"      on public.event_attendance for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "attendance admin"    on public.event_attendance for all
  using (public.is_admin()) with check (public.is_admin());

-- ANNONCES / NOTIFICATIONS
create policy "announcements read"  on public.announcements for select using (public.is_active_member());
create policy "announcements admin" on public.announcements for all    using (public.is_admin()) with check (public.is_admin());
create policy "notif read own"  on public.notifications for select
  using (user_id = auth.uid() or user_id is null);
create policy "notif update own" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notif admin" on public.notifications for all
  using (public.is_admin()) with check (public.is_admin());

-- CHORISTE DU MOIS
create policy "com read"  on public.chorist_of_month for select using (public.is_active_member());
create policy "com admin" on public.chorist_of_month for all    using (public.is_admin()) with check (public.is_admin());

-- RÈGLEMENT / BUREAU / FAQ / HELP : lecture membres, écriture admin
create policy "regl read"  on public.reglement_articles for select using (public.is_active_member());
create policy "regl admin" on public.reglement_articles for all    using (public.is_admin()) with check (public.is_admin());
create policy "bureau read"  on public.bureau_members for select using (public.is_active_member());
create policy "bureau admin" on public.bureau_members for all    using (public.is_admin()) with check (public.is_admin());
create policy "faq read"  on public.faq for select using (public.is_active_member());
create policy "faq admin" on public.faq for all    using (public.is_admin()) with check (public.is_admin());
create policy "help read"  on public.help_links for select using (public.is_active_member());
create policy "help admin" on public.help_links for all    using (public.is_admin()) with check (public.is_admin());

-- MESSAGERIE : accès réservé aux membres de la conversation
create policy "conv read"  on public.conversations for select using (public.is_conversation_member(id));
create policy "conv member read" on public.conversation_members for select using (user_id = auth.uid() or public.is_conversation_member(conversation_id));
create policy "msg read"   on public.messages for select using (public.is_conversation_member(conversation_id));
create policy "msg insert" on public.messages for insert with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

-- ============================================================================
-- 12. STORAGE : BUCKETS + POLICIES
--     (buckets créés via l'API/Dashboard ; policies sur storage.objects)
-- ============================================================================
insert into storage.buckets (id, name, public) values
  ('avatars',     'avatars',     true),
  ('feed-photos', 'feed-photos', true),
  ('song-audio',  'song-audio',  true),
  ('song-scores', 'song-scores', true)
on conflict (id) do nothing;

-- Lecture publique des 4 buckets (URLs directes dans l'app)
create policy "public read buckets" on storage.objects for select
  using (bucket_id in ('avatars','feed-photos','song-audio','song-scores'));

-- avatars : chacun écrit dans son dossier {uid}/...
create policy "avatar write own" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar update own" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- feed-photos : tout membre actif peut téléverser
create policy "feed write members" on storage.objects for insert
  with check (bucket_id = 'feed-photos' and public.is_active_member());

-- song-audio / song-scores : admin uniquement
create policy "song media admin write" on storage.objects for insert
  with check (bucket_id in ('song-audio','song-scores') and public.is_admin());
create policy "song media admin update" on storage.objects for update
  using (bucket_id in ('song-audio','song-scores') and public.is_admin());
create policy "song media admin delete" on storage.objects for delete
  using (bucket_id in ('song-audio','song-scores') and public.is_admin());

-- ============================================================================
-- 13. SEED MINIMAL (catégories gérées par enum ; ici données de démarrage)
-- ============================================================================
-- NB : le compte admin se crée via Auth puis on exécute :
--   update public.profiles set role='admin', status='active' where email='admin@...';
-- Les articles de règlement, FAQ et bureau seront saisis depuis l'espace admin.

-- Fin de migration.
