import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCircle, Lock, ShieldStar } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { looksLikeEmail, isSyntheticEmail } from '../../lib/config'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button, Sheet } from '../../components/ui'
import { useToast } from '../../context/ToastContext'

export default function Login() {
  const nav = useNavigate()
  const { show } = useToast()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [forgot, setForgot] = useState(false)

  const submit = async () => {
    if (!identifier.trim() || !password) { show('Renseignez vos identifiants.', 'error'); return }
    setBusy(true)

    let authEmail = identifier.trim()
    const { data: resolved } = await supabase.rpc('resolve_login_email', { p_identifier: identifier.trim() })
    if (resolved) authEmail = resolved
    else if (!looksLikeEmail(identifier)) {
      setBusy(false); show('Aucun compte trouvé avec cet identifiant.', 'error'); return
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password })
    if (error) { setBusy(false); show('Identifiants incorrects.', 'error'); return }

    const { data: prof } = await supabase.from('profiles').select('must_change_password, status').eq('id', data.user.id).maybeSingle()
    setBusy(false)
    if (prof?.must_change_password) { nav('/change-password', { replace: true }); return }
    nav('/', { replace: true })
  }

  return (
    <Screen>
      <BackHeader title="Connexion" />
      <div className="pad" style={{ paddingTop: 10, paddingBottom: 30 }}>
        <div className="center stack" style={{ gap: 12, marginBottom: 26 }}>
          <img src="/logo-pad.png" alt="" style={{ width: 150 }} />
        </div>

        <Field
          label="Téléphone ou email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="+225 … ou vous@mail.com"
          icon={<UserCircle size={19} />}
        />
        <Field label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" icon={<Lock size={19} />} />

        <div style={{ textAlign: 'right', margin: '-6px 0 16px' }}>
          <button className="tap" onClick={() => setForgot(true)} style={{ font: '600 12.5px var(--font-ui)', color: 'var(--cyan-dark)' }}>
            Mot de passe oublié ?
          </button>
        </div>

        <Button variant="primary" onClick={submit} disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</Button>

        <button className="tap center" onClick={() => nav('/admin/login')} style={{ marginTop: 22, gap: 6, color: 'var(--muted-2)' }}>
          <ShieldStar size={16} />
          <span style={{ font: '600 12px var(--font-ui)' }}>Accès administrateur</span>
        </button>
      </div>

      {forgot && <ForgotSheet onClose={() => setForgot(false)} notify={show} defaultValue={identifier} />}
    </Screen>
  )
}

function ForgotSheet({ onClose, notify, defaultValue }) {
  const [id, setId] = useState(defaultValue || '')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!id.trim()) { notify('Entrez votre téléphone ou email.', 'error'); return }
    setBusy(true)
    // On tente de résoudre l'identifiant vers l'email d'authentification.
    const { data: authEmail } = await supabase.rpc('resolve_login_email', { p_identifier: id.trim() })
    // Email réel disponible ? -> envoi d'un lien de réinitialisation.
    let realEmail = null
    if (authEmail && !isSyntheticEmail(authEmail)) realEmail = authEmail
    else if (looksLikeEmail(id) && !isSyntheticEmail(id)) realEmail = id.trim()

    if (realEmail) {
      const { error } = await supabase.auth.resetPasswordForEmail(realEmail, { redirectTo: `${window.location.origin}/login` })
      setBusy(false)
      if (error) { notify(error.message, 'error'); return }
      notify('Un lien de réinitialisation a été envoyé par email.', 'success')
      onClose()
    } else {
      // Compte sans email réel (identifiant = téléphone) : la réinitialisation
      // se fait par l'administrateur depuis l'espace admin (Membres).
      setBusy(false)
      notify("Aucun email associé. Contactez l'administrateur de la chorale : il pourra réinitialiser votre mot de passe.", 'error')
    }
  }

  return (
    <Sheet title="Mot de passe oublié" onClose={onClose}
      footer={<Button variant="primary" onClick={submit} disabled={busy}>{busy ? 'Envoi…' : 'Réinitialiser'}</Button>}>
      <p style={{ font: '400 13px var(--font-ui)', color: 'var(--body-2)', lineHeight: 1.6, margin: '0 0 14px' }}>
        Si un email est associé à votre compte, vous recevrez un lien de réinitialisation.
        Sinon, l'administrateur de la chorale pourra vous générer un nouveau mot de passe.
      </p>
      <Field label="Téléphone ou email" value={id} onChange={(e) => setId(e.target.value)} placeholder="+225 … ou vous@mail.com" icon={<UserCircle size={19} />} />
    </Sheet>
  )
}
