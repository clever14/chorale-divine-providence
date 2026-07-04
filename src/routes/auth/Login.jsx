import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCircle, Lock, ShieldStar } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { looksLikeEmail } from '../../lib/config'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button } from '../../components/ui'
import { useToast } from '../../context/ToastContext'

export default function Login() {
  const nav = useNavigate()
  const { show } = useToast()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!identifier.trim() || !password) { show('Renseignez vos identifiants.', 'error'); return }
    setBusy(true)

    // On résout l'identifiant (téléphone OU email) vers l'email d'authentification réel.
    let authEmail = identifier.trim()
    const { data: resolved } = await supabase.rpc('resolve_login_email', { p_identifier: identifier.trim() })
    if (resolved) authEmail = resolved
    else if (!looksLikeEmail(identifier)) {
      // Saisie d'un téléphone inconnu : rien à résoudre.
      setBusy(false); show('Aucun compte trouvé avec cet identifiant.', 'error'); return
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password })
    if (error) { setBusy(false); show('Identifiants incorrects.', 'error'); return }

    // Mot de passe temporaire attribué par l'admin -> changement obligatoire.
    const { data: prof } = await supabase.from('profiles').select('must_change_password, status').eq('id', data.user.id).maybeSingle()
    setBusy(false)
    if (prof?.must_change_password) { nav('/change-password', { replace: true }); return }
    nav('/', { replace: true }) // les gardes redirigent selon le statut
  }

  return (
    <Screen>
      <BackHeader title="Connexion" />
      <div className="pad" style={{ paddingTop: 10, paddingBottom: 30 }}>
        <div className="center stack" style={{ gap: 12, marginBottom: 26 }}>
          <img src="/logo.png" alt="" style={{ width: 130 }} />
        </div>

        <Field
          label="Téléphone ou email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="+225 … ou vous@mail.com"
          icon={<UserCircle size={19} />}
        />
        <Field label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" icon={<Lock size={19} />} />

        <Button variant="primary" onClick={submit} disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</Button>

        <button className="tap center" onClick={() => nav('/admin/login')} style={{ marginTop: 22, gap: 6, color: 'var(--muted-2)' }}>
          <ShieldStar size={16} />
          <span style={{ font: '600 12px var(--font-ui)' }}>Accès administrateur</span>
        </button>
      </div>
    </Screen>
  )
}
