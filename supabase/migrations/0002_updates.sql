-- ============================================================================
-- Chorale Divine Providence — Migration 0002 (mises à jour)
-- À exécuter APRÈS 0001_init.sql, dans le SQL Editor.
-- Ajouts : email de contact optionnel, résolution login téléphone/email,
--          drapeau "doit changer son mot de passe", garanties code usage unique.
-- ============================================================================

-- 1) Colonnes supplémentaires sur profiles ----------------------------------
alter table public.profiles add column if not exists contact_email text;
alter table public.profiles add column if not exists must_change_password boolean not null default false;

-- 2) handle_new_user : stocke le téléphone, l'email d'auth et l'email de contact
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, contact_email, phone, pupitre, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,                                        -- email d'authentification (réel ou synthétique)
    nullif(new.raw_user_meta_data->>'contact_email',''), -- email réel si fourni, sinon null
    new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'pupitre','')::pupitre,
    upper(left(coalesce(new.raw_user_meta_data->>'full_name','?'),1))
  );
  return new;
end;
$$;

-- 3) Résolution de l'identifiant de connexion (téléphone OU email) ----------
--    Renvoie l'email d'authentification à utiliser avec signInWithPassword.
create or replace function public.resolve_login_email(p_identifier text)
returns text language sql stable security definer set search_path = public as $$
  select email
  from public.profiles
  where phone = p_identifier
     or lower(email) = lower(p_identifier)
     or lower(coalesce(contact_email,'')) = lower(p_identifier)
  limit 1;
$$;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- 4) Code d'invitation : USAGE UNIQUE, mais n'active PLUS le compte automatiquement.
--    Le compte reste "pending" jusqu'à validation par l'administrateur (points 1 & 4).
--    On redéfinit redeem_invitation pour qu'elle marque seulement le code comme utilisé.
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

  -- Marque le code consommé (usage unique). N'active PAS le compte.
  update public.invitation_codes
     set used = true, used_by = auth.uid(), used_at = now()
   where id = v_id;
end;
$$;
grant execute on function public.redeem_invitation(text) to authenticated;

-- 5) Autoriser le choriste à mettre à jour son propre must_change_password
--    (déjà couvert par la policy "profiles self update" + trigger qui n'interdit
--     que role/status ; must_change_password est donc modifiable par l'intéressé).

-- Fin migration 0002.
