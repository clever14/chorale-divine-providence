import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldStar, IdentificationCard, Lock, Eye, EyeSlash, ArrowRight } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { StatusBar } from '../../components/Layout'
import { useToast } from '../../context/ToastContext'
import { CaretLeft } from '@phosphor-icons/react'

export default function LoginAdmin() {
  const nav = useNavigate()
  const { show } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setBusy(false); show('Identifiants incorrects.', 'error'); return }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    setBusy(false)
    if (prof?.role !== 'admin') {
      await supabase.auth.signOut()
      show("Ce compte n'a pas les droits administrateur.", 'error')
      return
    }
    nav('/admin', { replace: true })
  }

  const darkField = {
    width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)',
    borderRadius: 13, padding: '14px 16px 14px 44px', color: '#fff', outline: 'none', font: '500 14px var(--font-ui)'
  }

  return (
    <div className="screen" style={{ background: 'linear-gradient(180deg,#02153f,#041f60 60%,#02112f)' }}>
      <StatusBar />
      <div className="screen-scroll" style={{ padding: '4px 30px 30px' }}>
        <button className="tap" onClick={() => nav(-1)} style={{ color: '#fff', display: 'flex', marginBottom: 24 }} aria-label="Retour">
          <CaretLeft size={24} weight="bold" />
        </button>

        <div className="center stack" style={{ gap: 14, marginBottom: 30 }}>
          <div className="center" style={{ width: 62, height: 62, borderRadius: 18, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)' }}>
            <ShieldStar size={30} weight="fill" color="var(--gold-light)" />
          </div>
          <div className="center stack" style={{ gap: 6 }}>
            <span style={{ font: '700 24px var(--font-serif)', color: '#fff' }}>Accès administrateur</span>
            <span style={{ font: 'italic 400 13px var(--font-serif)', color: 'var(--cyan-soft)' }}>Réservé à l'administrateur de la chorale</span>
          </div>
        </div>

        <div className="stack" style={{ gap: 8, marginBottom: 16 }}>
          <span className="label" style={{ color: 'var(--cyan-soft)' }}>Identifiant admin</span>
          <div style={{ position: 'relative' }}>
            <IdentificationCard size={19} color="rgba(255,255,255,.5)" style={{ position: 'absolute', left: 15, top: 15 }} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@chorale.org" style={darkField} />
          </div>
        </div>

        <div className="stack" style={{ gap: 8, marginBottom: 26 }}>
          <span className="label" style={{ color: 'var(--cyan-soft)' }}>Mot de passe</span>
          <div style={{ position: 'relative' }}>
            <Lock size={19} color="rgba(255,255,255,.5)" style={{ position: 'absolute', left: 15, top: 15 }} />
            <input type={reveal ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ ...darkField, paddingRight: 44 }} />
            <button className="tap" onClick={() => setReveal(!reveal)} style={{ position: 'absolute', right: 14, top: 14, color: 'rgba(255,255,255,.6)', display: 'flex' }}>
              {reveal ? <EyeSlash size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>

        <button className="btn btn-gold tap" onClick={submit} disabled={busy}>
          {busy ? 'Connexion…' : "Entrer dans l'espace admin"} <ArrowRight size={18} weight="bold" />
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, font: '400 11px var(--font-ui)', color: 'rgba(255,255,255,.45)', lineHeight: 1.6 }}>
          Accès distinct des comptes choristes.<br />Un seul administrateur par chorale.
        </p>
      </div>
    </div>
  )
}
