import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnvelopeSimple, Lock, ShieldStar } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button } from '../../components/ui'
import { useToast } from '../../context/ToastContext'

export default function Login() {
  const nav = useNavigate()
  const { show } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) { show('Identifiants incorrects.', 'error'); return }
    // La redirection est gérée par les gardes (RedirectIfAuthed sur "/").
    nav('/', { replace: true })
  }

  return (
    <Screen>
      <BackHeader title="Connexion" />
      <div className="pad" style={{ paddingTop: 20, paddingBottom: 30 }}>
        <div className="center stack" style={{ gap: 12, marginBottom: 28 }}>
          <img src="/logo.png" alt="" style={{ width: 130 }} />
        </div>

        <Field label="Email ou téléphone" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@mail.com" icon={<EnvelopeSimple size={19} />} />
        <Field label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" icon={<Lock size={19} />} />

        <button className="tap" onClick={() => show('Contactez l’administrateur pour réinitialiser.', 'info')} style={{ display: 'block', marginLeft: 'auto', marginBottom: 20, font: '600 12px var(--font-ui)', color: 'var(--cyan-dark)' }}>
          Mot de passe oublié ?
        </button>

        <Button variant="primary" onClick={submit} disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</Button>

        <button className="tap center" onClick={() => nav('/admin/login')} style={{ marginTop: 22, gap: 6, color: 'var(--muted-2)' }}>
          <ShieldStar size={16} />
          <span style={{ font: '600 12px var(--font-ui)' }}>Accès administrateur</span>
        </button>
      </div>
    </Screen>
  )
}
