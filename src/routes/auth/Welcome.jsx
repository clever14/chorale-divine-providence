import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldStar } from '@phosphor-icons/react'
import { StatusBar } from '../../components/Layout'
import { Button } from '../../components/ui'

export default function Welcome() {
  const nav = useNavigate()
  const [code, setCode] = useState('')

  const onCodeChange = (e) => {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (v.startsWith('CDP')) v = v.slice(3)
    v = v.slice(0, 4)
    setCode(v)
  }

  const full = code ? `CDP-${code}` : ''

  return (
    <div className="screen" style={{ background: '#fff' }}>
      <StatusBar />
      <div className="screen-scroll" style={{ display: 'flex', flexDirection: 'column', padding: '20px 30px 30px' }}>
        <div className="grow center stack" style={{ gap: 22, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 8, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(3,159,200,.16), rgba(3,159,200,0) 70%)' }} />
          <img src="/logo.png" alt="Chorale Divine Providence" style={{ width: 210, position: 'relative' }} />
          <p className="serif" style={{ textAlign: 'center', font: 'italic 400 15px var(--font-serif)', color: 'var(--body-2)', lineHeight: 1.6, position: 'relative', margin: 0 }}>
            L'application de la chorale,<br />réservée à ses membres
          </p>
        </div>

        <div className="stack" style={{ gap: 8, marginBottom: 14 }}>
          <span className="label">Code d'invitation</span>
          <div className="row" style={{ background: '#fff', border: '1.5px solid var(--navy)', borderRadius: 13, padding: '14px 18px', gap: 4, justifyContent: 'center' }}>
            <span style={{ font: '700 20px var(--font-ui)', letterSpacing: 4, color: 'var(--navy)' }}>CDP–</span>
            <input
              value={code}
              onChange={onCodeChange}
              placeholder="0000"
              inputMode="text"
              autoCapitalize="characters"
              style={{ width: 96, border: 'none', outline: 'none', background: 'transparent', font: '700 20px var(--font-ui)', letterSpacing: 6, color: 'var(--cyan)', textAlign: 'left' }}
            />
          </div>
        </div>

        <Button variant="primary" onClick={() => nav('/register', { state: { code: full } })}>
          Créer un compte
        </Button>

        <div className="center" style={{ marginTop: 16, gap: 6 }}>
          <span style={{ font: '400 13px var(--font-ui)', color: 'var(--muted)' }}>Déjà membre ?</span>
          <button className="tap" onClick={() => nav('/login')} style={{ font: '700 13px var(--font-ui)', color: 'var(--navy)' }}>
            Se connecter
          </button>
        </div>

        <button className="tap center" onClick={() => nav('/admin/login')} style={{ marginTop: 18, gap: 6, color: 'var(--muted-2)' }}>
          <ShieldStar size={16} />
          <span style={{ font: '600 12px var(--font-ui)' }}>Accès administrateur</span>
        </button>
      </div>
    </div>
  )
}
