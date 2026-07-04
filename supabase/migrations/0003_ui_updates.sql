-- ============================================================================
-- Chorale Divine Providence — Migration 0003 (mises à jour interface / lot v3)
-- À exécuter APRÈS 0001_init.sql et 0002_updates.sql, dans le SQL Editor.
--
-- Ce que cette migration ajoute :
--   1. Les annonces de l'admin apparaissent désormais AUSSI dans "Le Fil"
--      comme "Annonce officielle" (colonnes is_official + title sur posts).
--   2. Les notifications deviennent cliquables (colonne link : où aller au clic).
--   3. Publication d'annonce atomique et sûre via une fonction dédiée
--      (annonce + post officiel + notification en une seule opération).
--   4. Démarrage d'une conversation 1:1 entre membres (bouton "Envoyer un message")
--      via une fonction qui trouve ou crée la conversation.
--   5. L'admin peut joindre une photo à une annonce (droit d'upload feed-photos).
--
-- Aucune donnée existante n'est supprimée. Rien à désactiver ici :
-- ces fonctions sont en SECURITY DEFINER et ne touchent pas au trigger
-- trg_protect_profile.
-- ============================================================================

-- 1) POSTS : marquer les annonces officielles + titre optionnel ---------------
alter table public.posts add column if not exists is_official boolean not null default false;
alter table public.posts add column if not exists title text;

-- 2) NOTIFICATIONS : cible de navigation au clic ------------------------------
alter table public.notifications add column if not exists link text;

-- 3) Publication d'une annonce par l'admin (atomique) -------------------------
--    Insère : l'annonce + un post "officiel" dans Le Fil + une notification
--    diffusée à tous, dont le clic ramène vers Le Fil.
create or replace function public.admin_publish_announcement(
  p_audience  text,
  p_title     text,
  p_message   text,
  p_photo_url text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_admin uuid := auth.uid();
  v_post  uuid;
begin
  if not public.is_admin() then
    raise exception 'ACCES_REFUSE';
  end if;

  insert into public.announcements (audience, title, message, created_by)
  values (p_audience, p_title, p_message, v_admin);

  insert into public.posts (author_id, body, photo_url, is_official, title)
  values (v_admin, p_message, p_photo_url, true, p_title)
  returning id into v_post;

  insert into public.notifications (user_id, type, title, body, link)
  values (null, 'announcement', p_title, p_message, '/feed');

  return v_post;
end;
$$;
grant execute on function public.admin_publish_announcement(text, text, text, text) to authenticated;

-- 4) Conversation directe entre deux membres (trouve ou crée) ----------------
--    Renvoie l'id de la conversation 1:1 entre l'appelant et p_other.
create or replace function public.get_or_create_direct_conversation(p_other uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_conv uuid;
begin
  if v_me is null then raise exception 'NON_AUTHENTIFIE'; end if;
  if v_me = p_other then raise exception 'CONVERSATION_AVEC_SOI_MEME'; end if;
  if not public.is_active_member() then raise exception 'ACCES_REFUSE'; end if;

  -- Conversation directe déjà existante entre les deux membres ?
  select c.id into v_conv
  from public.conversations c
  join public.conversation_members m1 on m1.conversation_id = c.id and m1.user_id = v_me
  join public.conversation_members m2 on m2.conversation_id = c.id and m2.user_id = p_other
  where c.is_group = false
  limit 1;

  if v_conv is not null then
    return v_conv;
  end if;

  insert into public.conversations (is_group) values (false) returning id into v_conv;
  insert into public.conversation_members (conversation_id, user_id)
  values (v_conv, v_me), (v_conv, p_other);

  return v_conv;
end;
$$;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

-- 5) Storage : autoriser l'admin à téléverser une photo d'annonce -------------
--    (le bucket feed-photos n'était ouvert qu'aux membres actifs).
drop policy if exists "feed write admin" on storage.objects;
create policy "feed write admin" on storage.objects for insert
  with check (bucket_id = 'feed-photos' and public.is_admin());

-- Fin migration 0003.
