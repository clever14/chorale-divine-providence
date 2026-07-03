import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button, Avatar, Loader, EmptyState } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { pupitreLabel } from '../../data/enums'

export default function ChoristOfMonthAdmin() {
  const nav = useNavigate()
  const { show } = useToast()
  const [selected, setSelected] = useState(null)
  const [motivation, setMotivation] = useState('')
  const [busy, setBusy] = useState(false)

  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, pupitre, avatar_initials, photo_url').eq('status', 'active').order('full_name')
    return data || []
  }, [])

  const save = async () => {
    if (!selected) { show('Sélectionnez un choriste.', 'error'); return }
    setBusy(true)
    const month = new Date()
    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`

    // Statistiques agrégées : présence % + événements présents
    const { data: att } = await supabase.from('event_attendance').select('status').eq('user_id', selected)
    const total = att?.length || 0
    const present = att?.filter((a) => a.status === 'present').length || 0
    const stats = { presence_pct: total ? Math.round((present / total) * 100) : 0, events_attended: present }

    const { error } = await supabase.from('chorist_of_month').upsert(
      { month: monthKey, user_id: selected, motivation, stats },
      { onConflict: 'month' }
    )
    setBusy(false)
    if (error) { show(error.message, 'error'); return }
    show('Choriste du mois désigné', 'success')
    nav(-1)
  }

  return (
    <Screen>
      <BackHeader title="Choriste du mois" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <Field label="Motivation" textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="Ex. Assiduité exemplaire et esprit d'équipe…" />

        <span className="label" style={{ display: 'block', marginBottom: 10 }}>Sélectionner un choriste</span>

        {loading ? <Loader /> : !data.length ? <EmptyState title="Aucun choriste actif" /> : (
          <div className="stack" style={{ gap: 8, marginBottom: 20 }}>
            {data.map((p) => (
              <button key={p.id} className="tap row" onClick={() => setSelected(p.id)} style={{
                padding: 12, gap: 12, borderRadius: 14, textAlign: 'left',
                background: selected === p.id ? 'rgba(3,159,200,.08)' : 'var(--card-bg)',
                border: `1px solid ${selected === p.id ? 'var(--cyan)' : 'var(--border-2)'}`
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${selected === p.id ? 'var(--cyan)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {selected === p.id && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--cyan)' }} />}
                </div>
                <Avatar name={p.full_name} initials={p.avatar_initials} url={p.photo_url} size={40} bg="var(--pink-bg)" color="var(--pink)" />
                <div className="stack grow">
                  <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{p.full_name}</span>
                  <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)' }}>{pupitreLabel(p.pupitre)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Désigner'}</Button>
      </div>
    </Screen>
  )
}
