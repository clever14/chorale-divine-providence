import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HourglassMedium, ArrowClockwise, SignIn } from '@phosphor-icons/react'
import { StatusBar } from '../../components/Layout'
import { Button } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

/**
 * Écran d'attente affiché après l'inscription.
 * Le compte reste en attente jusqu'à validation par l'administrateur.
 */
export default function Pending() {
  const nav = useNavigate()
  const { refreshProfile, signOut, isActive } = useAuth()
  const [checking, setChecking] = useState(false)

  const check = async () => {
    setChecking(true)
    await refreshProfile()
    setChecking(false)
    if (isActive) nav('/app', { replace: true })
  }

  const backToLogin = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <div className="screen" style={{ background: '#fff' }}>
      <StatusBar />
      <div className="screen-scroll center stack" style={{ padding: '20px 34px 30px', textAlign: 'center', gap: 20 }}>
        <div className="center" style={{ width: 96, height: 96, borderRadius: '50%', background: 'radial-gradient(circle, rgba(3,159,200,.16), rgba(3,159,200,0) 70%)' }}>
          <div className="center" style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--grad-banner)' }}>
            <HourglassMedium size={32} color="#fff" weight="fill" />
          </div>
        </div>

        <div className="stack" style={{ gap: 10 }}>
          <span style={{ font: '700 22px var(--font-serif)', color: 'var(--title)' }}>Compte en attente</span>
          <p style={{ font: '400 14px var(--font-ui)', color: 'var(--body-2)', lineHeight: 1.7, margin: 0 }}>
            Veuillez patienter pendant la validation de votre compte. L'administrateur de la chorale examinera votre demande. Vous pourrez ensuite vous connecter avec vos identifiants.
          </p>
        </div>

        <div className="stack" style={{ gap: 12, width: '100%', marginTop: 10 }}>
          <Button variant="cyan" onClick={check} disabled={checking}>
            <ArrowClockwise size={18} weight="bold" /> {checking ? 'Vérification…' : 'Vérifier mon statut'}
          </Button>
          <Button variant="ghost" onClick={backToLogin}>
            <SignIn size={18} weight="bold" /> Retourner à la page de connexion
          </Button>
        </div>
      </div>
    </div>
  )
}
