-- ============================================================================
-- Chorale Divine Providence — Migration 0004 (Le Fil : enregistrements)
-- À exécuter APRÈS 0001, 0002 et 0003, dans le SQL Editor de Supabase.
--
-- Ce que cette migration ajoute :
--   • Table post_bookmarks : permet à chaque membre d'enregistrer (marque-page)
--     une publication du Fil, comme sur la maquette (icône signet).
--   • RLS : chaque membre ne voit et ne gère QUE ses propres enregistrements.
--
-- Aucune donnée existante n'est modifiée ou supprimée.
-- Le bucket "feed-photos" accepte déjà photo / vidéo / audio pour un membre
-- actif (policy "feed write members" de 0001) : rien à changer côté Storage.
-- ============================================================================

create table if not exists public.post_bookmarks (
  post_id    uuid not null references public.posts(id)    on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_bookmarks enable row level security;

-- Lecture : uniquement mes propres enregistrements.
drop policy if exists "bookmarks own read" on public.post_bookmarks;
create policy "bookmarks own read" on public.post_bookmarks
  for select using (user_id = auth.uid());

-- Écriture (insert / delete) : uniquement mes propres enregistrements.
drop policy if exists "bookmarks own write" on public.post_bookmarks;
create policy "bookmarks own write" on public.post_bookmarks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Fin migration 0004.
