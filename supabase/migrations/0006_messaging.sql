-- ============================================================================
-- Chorale Divine Providence — Migration 0006 (Messagerie : lus / non-lus,
-- badge, envoi par le Service Communication, temps réel)
-- À exécuter APRÈS 0001 → 0005, dans le SQL Editor de Supabase.
--
-- Ce que cette migration ajoute :
--   1. conversation_members.last_read_at : date de dernière lecture par membre.
--      -> permet de savoir combien de messages restent NON LUS.
--   2. mark_conversation_read(conv)  : marque une conversation comme lue.
--   3. unread_conversations()        : renvoie le nombre de non-lus par conversation
--                                      (le client en fait la somme pour le badge).
--   4. admin_send_message(...)       : le Service Communication (admin) envoie un
--                                      message INDIVIDUEL (un membre) ou GROUPÉ
--                                      (un pupitre / toute la chorale). Chaque
--                                      destinataire reçoit le message dans sa
--                                      conversation 1:1 privée avec l'admin.
--   5. Temps réel : la table messages est ajoutée à la publication realtime.
--
-- Aucune donnée existante n'est supprimée. Les conversations déjà présentes
-- sont marquées « lues » (last_read_at = maintenant) pour éviter un badge géant
-- au premier déploiement.
-- ============================================================================

-- 1) Suivi de lecture par membre ---------------------------------------------
alter table public.conversation_members
  add column if not exists last_read_at timestamptz;

-- Historique existant considéré comme lu (pas de badge rétroactif).
update public.conversation_members
   set last_read_at = now()
 where last_read_at is null;

-- 2) Marquer une conversation comme lue (appelé à l'ouverture d'un fil) -------
create or replace function public.mark_conversation_read(p_conversation uuid)
returns void
language sql security definer set search_path = public as $$
  update public.conversation_members
     set last_read_at = now()
   where conversation_id = p_conversation
     and user_id = auth.uid();
$$;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- 3) Nombre de messages non lus par conversation (pour l'appelant) -----------
--    Un message est « non lu » s'il n'a pas été envoyé par moi ET s'il est
--    postérieur à ma dernière lecture (ou si je n'ai jamais lu ce fil).
create or replace function public.unread_conversations()
returns table (conversation_id uuid, unread bigint)
language sql stable security definer set search_path = public as $$
  select cm.conversation_id,
         count(msg.id) filter (
           where msg.sender_id <> auth.uid()
             and (cm.last_read_at is null or msg.created_at > cm.last_read_at)
         ) as unread
  from public.conversation_members cm
  left join public.messages msg on msg.conversation_id = cm.conversation_id
  where cm.user_id = auth.uid()
  group by cm.conversation_id;
$$;
grant execute on function public.unread_conversations() to authenticated;

-- 4) Envoi d'un message par le Service Communication (admin) -----------------
--    p_target   : id d'un membre  -> message INDIVIDUEL
--    p_audience : 'all' ou un pupitre ('soprano', 'alto', …) -> message GROUPÉ
--    (utiliser l'un OU l'autre ; p_target est prioritaire s'il est fourni)
--    Renvoie le nombre de destinataires effectivement servis.
create or replace function public.admin_send_message(
  p_body     text,
  p_target   uuid default null,
  p_audience text default null
)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_admin  uuid := auth.uid();
  v_member record;
  v_conv   uuid;
  v_count  integer := 0;
begin
  if not public.is_admin() then
    raise exception 'ACCES_REFUSE';
  end if;
  if coalesce(btrim(p_body), '') = '' then
    raise exception 'MESSAGE_VIDE';
  end if;
  if p_target is null and coalesce(btrim(p_audience), '') = '' then
    raise exception 'DESTINATAIRE_MANQUANT';
  end if;

  for v_member in
    select id
    from public.profiles
    where status = 'active'
      and id <> v_admin
      and (
        (p_target is not null and id = p_target)
        or
        (p_target is null and (p_audience = 'all' or pupitre::text = p_audience))
      )
  loop
    -- Conversation 1:1 admin <-> membre déjà existante ?
    select c.id into v_conv
    from public.conversations c
    join public.conversation_members a on a.conversation_id = c.id and a.user_id = v_admin
    join public.conversation_members b on b.conversation_id = c.id and b.user_id = v_member.id
    where c.is_group = false
    limit 1;

    -- Sinon, on la crée.
    if v_conv is null then
      insert into public.conversations (is_group) values (false) returning id into v_conv;
      insert into public.conversation_members (conversation_id, user_id)
      values (v_conv, v_admin), (v_conv, v_member.id);
    end if;

    insert into public.messages (conversation_id, sender_id, body)
    values (v_conv, v_admin, btrim(p_body));

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
grant execute on function public.admin_send_message(text, uuid, text) to authenticated;

-- 5) Temps réel : diffuser les INSERT de messages aux membres concernés ------
--    (la RLS "msg read" garantit que chacun ne reçoit que SES conversations).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- Fin migration 0006.
