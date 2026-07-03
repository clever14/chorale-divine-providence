import { TrendUp, Users, CalendarCheck } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Loader } from '../../components/ui'
import { STAT_PUPITRES } from '../../data/enums'
import { monthName } from '../../lib/format'

export default function Stats() {
  const { data, loading } = useAsync(async () => {
    const [{ data: byP }, { count: totalMembers }, { count: totalEvents }] = await Promise.all([
      supabase.from('stats_attendance_by_pupitre').select('*'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('events').select('id', { count: 'exact', head: true })
    ])
    const rows = byP || []
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + (r.present_pct || 0), 0) / rows.length) : 0
    return { rows, avg, totalMembers: totalMembers || 0, totalEvents: totalEvents || 0 }
  }, [])

  return (
    <Screen>
      <BackHeader title="Statistiques" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        {loading ? <Loader /> : (
          <>
            {/* Bandeau moyenne */}
            <div style={{ background: 'var(--grad-banner)', borderRadius: 20, padding: 22, color: '#fff', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 18, right: 20, opacity: .12 }}>
                <TrendUp size={70} weight="fill" />
              </div>
              <div style={{ font: '700 11px var(--font-ui)', letterSpacing: 1.4, color: 'var(--cyan-light)', textTransform: 'uppercase', marginBottom: 8 }}>Présence moyenne · {monthName()}</div>
              <div style={{ font: '700 34px var(--font-ui)' }}>{data.avg}%</div>
              <div style={{ font: '400 12px var(--font-ui)', color: 'rgba(255,255,255,.7)', marginTop: 4 }}>Toutes voix confondues</div>
            </div>

            {/* Barres par pupitre */}
            <div className="card" style={{ padding: 18, marginBottom: 20 }}>
              <span className="label" style={{ display: 'block', marginBottom: 14 }}>Par pupitre</span>
              <div className="stack" style={{ gap: 16 }}>
                {STAT_PUPITRES.map((p) => {
                  const row = data.rows.find((r) => r.pupitre === p.value)
                  const pct = row?.present_pct ?? 0
                  return (
                    <div key={p.value} className="stack" style={{ gap: 6 }}>
                      <div className="spread">
                        <span style={{ font: '600 13px var(--font-ui)', color: 'var(--title)' }}>{p.label}</span>
                        <span style={{ font: '700 13px var(--font-ui)', color: 'var(--cyan-dark)' }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--field-bg)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--grad-btn-cyan)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Compteurs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Counter icon={<Users size={22} weight="fill" />} value={data.totalMembers} label="Membres actifs" />
              <Counter icon={<CalendarCheck size={22} weight="fill" />} value={data.totalEvents} label="Événements" />
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}

function Counter({ icon, value, label }) {
  return (
    <div className="card stack" style={{ padding: 16, gap: 8 }}>
      <div className="center" style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(3,159,200,.1)', color: 'var(--cyan-dark)' }}>{icon}</div>
      <div style={{ font: '700 22px var(--font-serif)', color: 'var(--navy)' }}>{value}</div>
      <div style={{ font: '600 11px var(--font-ui)', letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}
