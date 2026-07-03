import { useNavigate } from 'react-router-dom'
import { Microphone, Church, Trophy, CaretRight, Newspaper, ChatsCircle } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { TabHeader } from '../../components/Layout'
import { Avatar, Loader } from '../../components/ui'
import { shortDateTime, monthName, initials } from '../../lib/format'
import { pupitreLabel } from '../../data/enums'

export default function Dashboard() {
  const nav = useNavigate()
  const { profile } = useAuth()

  const { data, loading } = useAsync(async () => {
    const now = new Date().toISOString()
    const [events, com] = await Promise.all([
      supabase.from('events').select('*').gte('starts_at', now).order('starts_at').limit(2),
      supabase.from('chorist_of_month').select('*, profiles(full_name, pupitre, avatar_initials)').order('month', { ascending: false }).limit(1).maybeSingle()
    ])
    return { events: events.data || [], com: com.data || null }
  }, [])

  return (
    <>
      <TabHeader
        greeting="Bonjour,"
        name={profile?.full_name}
        avatar={<Avatar name={profile?.full_name} initials={profile?.avatar_initials} bg="var(--cyan-soft)" />}
      />

      <div className="pad" style={{ paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Message du jour */}
        <div style={{ borderRadius: 20, padding: 22, background: 'var(--grad-banner)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ font: '700 11px var(--font-ui)', letterSpacing: 1.4, color: 'var(--cyan-light)', marginBottom: 12 }}>✦ MESSAGE DU JOUR</div>
          <p className="serif" style={{ font: 'italic 700 18px var(--font-serif)', lineHeight: 1.5, margin: '0 0 12px' }}>
            « Chantez au Seigneur un cantique nouveau, chantez au Seigneur, terre entière. »
          </p>
          <span style={{ font: '500 12px var(--font-ui)', color: 'rgba(255,255,255,.75)' }}>Psaume 96</span>
        </div>

        {/* Prochains événements */}
        {loading ? <Loader /> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(data?.events?.length ? data.events : PLACEHOLDER).map((ev, i) => (
              <div key={ev.id || i} className="card tap" onClick={() => nav('/agenda')} style={{ padding: 16 }}>
                <div className="center" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--pink-bg)', marginBottom: 12 }}>
                  {i === 0 ? <Microphone size={20} color="var(--cyan-dark)" weight="fill" /> : <Church size={20} color="var(--cyan-dark)" weight="fill" />}
                </div>
                <div style={{ font: '700 10px var(--font-ui)', letterSpacing: 1, color: 'var(--cyan-dark)', textTransform: 'uppercase', marginBottom: 4 }}>{ev.type || (i === 0 ? 'Répétition' : 'Messe')}</div>
                <div style={{ font: '700 16px var(--font-serif)', color: 'var(--title)' }}>{ev.starts_at ? shortDateTime(ev.starts_at) : ev.fallback}</div>
                <div style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)', marginTop: 2 }}>{ev.location || ev.loc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Choriste du mois */}
        <div className="card tap" onClick={() => nav('/chorist-of-month')} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="center" style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold-light)' }}>
            <Trophy size={22} color="#fff" weight="fill" />
          </div>
          <div className="stack grow">
            <span style={{ font: '700 10px var(--font-ui)', letterSpacing: 1, color: 'var(--cyan-dark)', textTransform: 'uppercase' }}>Choriste du mois · {monthName()}</span>
            <span style={{ font: '700 15px var(--font-serif)', color: 'var(--title)' }}>
              {data?.com ? `${data.com.profiles?.full_name} · ${pupitreLabel(data.com.profiles?.pupitre)}` : 'À désigner'}
            </span>
          </div>
          <CaretRight size={18} color="var(--muted)" />
        </div>

        {/* Accès rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <QuickAccess icon={<Newspaper size={22} weight="fill" />} label="Le Fil" onClick={() => nav('/feed')} />
          <QuickAccess icon={<ChatsCircle size={22} weight="fill" />} label="Messages" onClick={() => nav('/messages')} />
        </div>
      </div>
    </>
  )
}

function QuickAccess({ icon, label, onClick }) {
  return (
    <button className="card tap" onClick={onClick} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
      <div className="center" style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(3,159,200,.1)', color: 'var(--cyan-dark)' }}>{icon}</div>
      <span style={{ font: '700 14px var(--font-serif)', color: 'var(--title)' }}>{label}</span>
    </button>
  )
}

const PLACEHOLDER = [
  { fallback: 'Ven · 19h00', type: 'Répétition', loc: 'Salle paroissiale' },
  { fallback: 'Dim · 08h00', type: 'Messe', loc: 'Dominicale' }
]
