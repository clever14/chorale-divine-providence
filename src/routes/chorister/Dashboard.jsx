import { useNavigate } from 'react-router-dom'
import { Microphone, Church, Trophy, CaretRight, MusicNote, Play } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { TabHeader } from '../../components/Layout'
import { Avatar, Loader } from '../../components/ui'
import { shortDateTime, monthName } from '../../lib/format'
import { pupitreLabel, categoryLabel } from '../../data/enums'

export default function Dashboard() {
  const nav = useNavigate()
  const { profile } = useAuth()

  const { data, loading } = useAsync(async () => {
    const now = new Date().toISOString()
    const [events, com, songs] = await Promise.all([
      supabase.from('events').select('*').gte('starts_at', now).order('starts_at').limit(2),
      supabase.from('chorist_of_month').select('*, profiles(full_name, pupitre, avatar_initials)').order('month', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('songs').select('id, title, category').order('created_at', { ascending: false }).limit(3)
    ])
    return { events: events.data || [], com: com.data || null, songs: songs.data || [] }
  }, [])

  const isRepet = (ev, i) => (ev.type ? /rep/i.test(ev.type) : i === 0)

  return (
    <>
      <TabHeader
        greeting="Bonjour,"
        name={profile?.full_name}
        avatar={<Avatar name={profile?.full_name} initials={profile?.avatar_initials} url={profile?.photo_url} bg="var(--cyan-soft)" />}
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

        {/* Prochains événements : Répétition + Messe côte à côte */}
        {loading ? <Loader /> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(data?.events?.length ? data.events : PLACEHOLDER).map((ev, i) => {
              const rep = isRepet(ev, i)
              return (
                <div key={ev.id || i} className="card tap" onClick={() => nav('/agenda')} style={{ padding: 16 }}>
                  <div className="center" style={{ width: 40, height: 40, borderRadius: 12, background: rep ? 'var(--pink-bg)' : 'rgba(3,159,200,.12)', marginBottom: 12 }}>
                    {rep ? <Microphone size={20} color="var(--cyan-dark)" weight="fill" /> : <Church size={20} color="var(--cyan-dark)" weight="fill" />}
                  </div>
                  <div style={{ font: '700 10px var(--font-ui)', letterSpacing: 1, color: 'var(--cyan-dark)', textTransform: 'uppercase', marginBottom: 4 }}>{ev.type || (rep ? 'Répétition' : 'Messe')}</div>
                  <div style={{ font: '700 16px var(--font-serif)', color: 'var(--title)' }}>{ev.starts_at ? shortDateTime(ev.starts_at) : ev.fallback}</div>
                  <div style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)', marginTop: 2 }}>{ev.location || ev.loc}</div>
                </div>
              )
            })}
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

        {/* Chants à répéter */}
        <div className="spread" style={{ marginTop: 2 }}>
          <span style={{ font: '700 17px var(--font-serif)', color: 'var(--title)' }}>Chants à répéter</span>
          <button className="tap" onClick={() => nav('/songs')} style={{ font: '700 12.5px var(--font-ui)', color: 'var(--cyan-dark)' }}>Tout voir</button>
        </div>
        {!loading && (data?.songs?.length ? (
          <div className="stack" style={{ gap: 10 }}>
            {data.songs.map((s) => (
              <div key={s.id} className="card tap row" onClick={() => nav(`/songs/${s.id}`)} style={{ padding: 14, gap: 14 }}>
                <div className="center" style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--grad-btn)', flexShrink: 0 }}>
                  <MusicNote size={22} color="#fff" weight="fill" />
                </div>
                <div className="stack grow">
                  <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)', lineHeight: 1.3 }}>{s.title}</span>
                  <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)' }}>{categoryLabel(s.category)}</span>
                </div>
                <div className="center" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(3,159,200,.12)', color: 'var(--cyan-dark)', flexShrink: 0 }}>
                  <Play size={16} weight="fill" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card center stack" style={{ padding: '22px 16px', gap: 6 }}>
            <MusicNote size={28} weight="light" color="var(--cyan-soft)" />
            <span style={{ font: '400 12.5px var(--font-ui)', color: 'var(--muted)' }}>Aucun chant pour le moment.</span>
          </div>
        ))}
      </div>
    </>
  )
}

const PLACEHOLDER = [
  { fallback: 'Ven · 19h00', type: 'Répétition', loc: 'Salle paroissiale' },
  { fallback: 'Dim · 08h00', type: 'Messe', loc: 'Dominicale' }
]
