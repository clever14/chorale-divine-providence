import { Trophy } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, Loader, EmptyState } from '../../components/ui'
import { pupitreLabel } from '../../data/enums'
import { monthName } from '../../lib/format'

export default function ChoristOfMonth() {
  const { data, loading } = useAsync(async () => {
    const { data: com } = await supabase
      .from('chorist_of_month')
      .select('*, profiles(full_name, pupitre, avatar_initials, photo_url)')
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle()
    return com
  }, [])

  if (loading) return <Screen><Loader /></Screen>
  if (!data) return (
    <Screen>
      <BackHeader title="Choriste du mois" />
      <EmptyState icon={<Trophy size={42} weight="light" />} title="Pas encore désigné" text="Le choriste du mois sera bientôt annoncé." />
    </Screen>
  )

  const stats = data.stats || {}
  return (
    <Screen>
      <BackHeader title="Choriste du mois" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <div className="center stack" style={{ gap: 14, marginBottom: 22 }}>
          <div style={{ position: 'relative', padding: 4, borderRadius: '50%', background: 'var(--grad-btn-gold)' }}>
            <Avatar name={data.profiles?.full_name} initials={data.profiles?.avatar_initials} url={data.profiles?.photo_url} size={120} bg="var(--pink-bg)" color="var(--pink)" />
            <div className="center" style={{ position: 'absolute', bottom: 0, right: 0, width: 34, height: 34, borderRadius: '50%', background: 'var(--grad-btn-gold)', border: '3px solid #fff' }}>
              <Trophy size={16} color="#fff" weight="fill" />
            </div>
          </div>
          <div className="center stack" style={{ gap: 4 }}>
            <span style={{ font: '700 22px var(--font-serif)', color: 'var(--title)' }}>{data.profiles?.full_name}</span>
            <span style={{ font: '400 13px var(--font-ui)', color: 'var(--muted)' }}>
              {pupitreLabel(data.profiles?.pupitre)} · {monthName(data.month)}
            </span>
          </div>
        </div>

        {data.motivation && (
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <span className="label" style={{ marginBottom: 8, display: 'block' }}>Motivation</span>
            <p className="serif" style={{ font: 'italic 400 14.5px var(--font-serif)', color: 'var(--body)', lineHeight: 1.7, margin: 0 }}>« {data.motivation} »</p>
          </div>
        )}

        <div className="stack" style={{ gap: 12 }}>
          <span className="label">Statistiques</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatBox value={`${stats.presence_pct ?? '—'}%`} label="Présence" />
            <StatBox value={stats.events_attended ?? '—'} label="Événements" />
          </div>
        </div>
      </div>
    </Screen>
  )
}

function StatBox({ value, label }) {
  return (
    <div className="card center stack" style={{ padding: 18, gap: 4 }}>
      <span style={{ font: '700 22px var(--font-serif)', color: 'var(--navy)' }}>{value}</span>
      <span style={{ font: '600 11px var(--font-ui)', letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}
