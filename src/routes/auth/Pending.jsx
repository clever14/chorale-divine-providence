import { useNavigate } from 'react-router-dom'
import { HourglassMedium, ArrowClockwise } from '@phosphor-icons/react'
import { StatusBar } from '../../components/Layout'
import { Button } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

export default function Pending() {
  const nav = useNavigate()
  const { refreshProfile, signOut, isActive } = useAuth()

  const check = async () => {
    await refreshProfile()
    if (isActive) nav('/app', { replace: true })
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
            Votre demande a bien été enregistrée. L'administrateur de la chorale va valider votre compte. Vous recevrez une notification dès qu'il sera actif.
          </p>
        </div>

        <div className="stack" style={{ gap: 12, width: '100%', marginTop: 10 }}>
          <Button variant="cyan" onClick={check}>
            <ArrowClockwise size={18} weight="bold" /> Vérifier mon statut
          </Button>
          <button className="tap" onClick={signOut} style={{ font: '600 13px var(--font-ui)', color: 'var(--muted)', padding: 8 }}>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
