import { CheckCircle, XCircle } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Loader, EmptyState } from '../../components/ui'
import { longDate } from '../../lib/format'

export default function Presence() {
  const { user } = useAuth()
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase
      .from('event_attendance')
      .select('*, events(title, type, starts_at, location)')
      .eq('user_id', user.id)
      .order('marked_at', { ascending: false })
    return data || []
  }, [])

  const total = data?.length || 0
  const present = data?.filter((a) => a.status === 'present').length || 0
  const rate = total ? Math.round((present / total) * 100) : 0

  return (
    <Screen>
      <BackHeader title="Mes présences" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <div style={{ background: 'var(--grad-banner)', borderRadius: 20, padding: 22, color: '#fff', marginBottom: 20 }}>
          <div style={{ font: '700 11px var(--font-ui)', letterSpacing: 1.4, color: 'var(--cyan-light)', textTransform: 'uppercase', marginBottom: 10 }}>Mon taux de présence</div>
          <div style={{ font: '700 34px var(--font-ui)' }}>{rate}%</div>
          <div style={{ font: '400 12px var(--font-ui)', color: 'rgba(255,255,255,.7)', marginTop: 4 }}>{present} présent(s) sur {total} événement(s)</div>
        </div>

        {loading ? <Loader /> : !data.length ? (
          <EmptyState title="Aucun historique" text="Vos présences apparaîtront ici." />
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {data.map((a) => (
              <div key={a.event_id} className="card row" style={{ padding: 14, gap: 12 }}>
                <div className="center" style={{ width: 40, height: 40, borderRadius: 12, background: a.status === 'present' ? 'var(--green-bg)' : 'var(--red-bg)', flexShrink: 0 }}>
                  {a.status === 'present'
                    ? <CheckCircle size={22} color="var(--green)" weight="fill" />
                    : <XCircle size={22} color="var(--red)" weight="fill" />}
                </div>
                <div className="stack grow">
                  <span style={{ font: '700 13px var(--font-ui)', color: 'var(--title)' }}>{a.events?.title}</span>
                  <span style={{ font: '400 11.5px var(--font-ui)', color: 'var(--muted)' }}>{longDate(a.events?.starts_at)}</span>
                </div>
                <span style={{ font: '700 11px var(--font-ui)', color: a.status === 'present' ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {a.status === 'present' ? 'Présent' : 'Absent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  )
}
