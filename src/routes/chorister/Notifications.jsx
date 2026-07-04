import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Megaphone, CalendarPlus, CheckCircle, CaretRight } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Loader, EmptyState } from '../../components/ui'
import { timeAgo } from '../../lib/format'

// Destination au clic : lien explicite, sinon selon le type.
const routeFor = (n) => n.link || ({ announcement: '/feed', event: '/agenda', account: '/app' })[n.type] || null

const ICONS = {
  announcement: <Megaphone size={20} color="var(--cyan-dark)" weight="fill" />,
  event: <CalendarPlus size={20} color="var(--navy)" weight="fill" />,
  account: <CheckCircle size={20} color="var(--green)" weight="fill" />
}

export default function Notifications() {
  const { user } = useAuth()
  const nav = useNavigate()

  const { data, loading, reload } = useAsync(async () => {
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(50)
    return notifs || []
  }, [])

  useEffect(() => {
    // Marquer comme lues en arrière-plan
    supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false).then(reload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const now = Date.now()
  const recent = data?.filter((n) => now - new Date(n.created_at).getTime() < 86400000) || []
  const earlier = data?.filter((n) => now - new Date(n.created_at).getTime() >= 86400000) || []

  return (
    <Screen>
      <BackHeader title="Notifications" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        {loading ? <Loader /> : !data.length ? (
          <EmptyState icon={<Bell size={42} weight="light" />} title="Aucune notification" text="Vous serez informé ici des annonces et événements." />
        ) : (
          <>
            {recent.length > 0 && <Section title="Nouvelles" items={recent} nav={nav} />}
            {earlier.length > 0 && <Section title="Plus tôt" items={earlier} nav={nav} />}
          </>
        )}
      </div>
    </Screen>
  )
}

function Section({ title, items, nav }) {
  return (
    <div className="stack" style={{ gap: 10, marginBottom: 20 }}>
      <span className="label">{title}</span>
      {items.map((n) => {
        const dest = routeFor(n)
        return (
          <button key={n.id} className="card tap row" disabled={!dest} onClick={() => dest && nav(dest)}
            style={{ padding: 14, gap: 12, width: '100%', textAlign: 'left' }}>
            <div className="center" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--field-bg)', flexShrink: 0 }}>
              {ICONS[n.type] || <Bell size={20} color="var(--muted)" />}
            </div>
            <div className="stack grow">
              <span style={{ font: '700 13px var(--font-ui)', color: 'var(--title)' }}>{n.title}</span>
              {n.body && <span style={{ font: '400 12.5px var(--font-ui)', color: 'var(--body-2)', lineHeight: 1.5 }}>{n.body}</span>}
              <span style={{ font: '400 11px var(--font-ui)', color: 'var(--muted)', marginTop: 3 }}>{timeAgo(n.created_at)}</span>
            </div>
            {dest && <CaretRight size={16} color="var(--muted)" style={{ flexShrink: 0 }} />}
          </button>
        )
      })}
    </div>
  )
}
