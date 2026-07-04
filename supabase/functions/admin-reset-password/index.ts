// Edge Function : réinitialisation du mot de passe d'un choriste par l'admin.
// Déploiement : Supabase Dashboard -> Edge Functions -> Deploy a new function
//   Nom : admin-reset-password
//   Colle ce fichier, puis Deploy.
// Sécurité : vérifie que l'appelant est bien un admin actif avant d'agir.
// La clé service_role est fournie automatiquement par Supabase (variable d'env).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // 1) Identifier l'appelant via son token
    const authHeader = req.headers.get('Authorization') || ''
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: uErr } = await caller.auth.getUser()
    if (uErr || !user) return json({ error: 'NON_AUTHENTIFIE' }, 401)

    // 2) Vérifier que l'appelant est admin
    const admin = createClient(url, serviceKey)
    const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (prof?.role !== 'admin') return json({ error: 'ACCES_REFUSE' }, 403)

    // 3) Lire la cible + le mot de passe temporaire
    const { target_user_id, temp_password } = await req.json()
    if (!target_user_id || !temp_password || String(temp_password).length < 6) {
      return json({ error: 'PARAMETRES_INVALIDES' }, 400)
    }

    // 4) Mettre à jour le mot de passe de la cible
    const { error: upErr } = await admin.auth.admin.updateUserById(target_user_id, { password: temp_password })
    if (upErr) return json({ error: upErr.message }, 400)

    // 5) Forcer le changement à la prochaine connexion
    await admin.from('profiles').update({ must_change_password: true }).eq('id', target_user_id)

    return json({ ok: true })
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}
