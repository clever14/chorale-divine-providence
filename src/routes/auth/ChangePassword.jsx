import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ShieldCheck } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { StatusBar } from '../../components/Layout'
import { Field, Button } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function ChangePassword() {
  const nav = useNavigate()
  const { user, refreshProfile } = useAuth()
  const { show } = useToast()
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (pwd.length < 6) { show('Au moins 6 caractères.', 'error'); return }
    if (pwd !== confirm) { show('Les mots de passe ne correspondent pas.', 'error'); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pwd })
    if (error) { setBusy(false); show(error.message, 'error'); return }
    await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id)
    await refreshProfile()
    setBusy(false)
    show('Mot de passe mis à jour', 'success')
    nav('/app', { replace: true })
  }

  return (
    <div className="screen" style={{ background: '#fff' }}>
      <StatusBar />
      <div className="screen-scroll" style={{ padding: '10px 30px 30px' }}>
        <div className="center stack" style={{ gap: 14, margin: '20px 0 26px', textAlign: 'center' }}>
          <div className="center" style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--grad-banner)' }}>
            <ShieldCheck size={32} color="#fff" weight="fill" />
          </div>
          <span style={{ font: '700 22px var(--font-serif)', color: 'var(--title)' }}>Nouveau mot de passe</span>
          <p style={{ font: '400 13.5px var(--font-ui)', color: 'var(--body-2)', lineHeight: 1.6, margin: 0 }}>
            Pour votre sécurité, veuillez définir un mot de passe personnel avant d'accéder à votre espace.
          </p>
        </div>

        <Field label="Nouveau mot de passe" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Au moins 6 caractères" icon={<Lock size={19} />} />
        <Field label="Confirmer le mot de passe" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" icon={<Lock size={19} />} />

        <Button variant="primary" onClick={submit} disabled={busy}>{busy ? 'Enregistrement…' : 'Valider et continuer'}</Button>
      </div>
    </div>
  )
}
