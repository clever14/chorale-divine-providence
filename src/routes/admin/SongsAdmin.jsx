import { useNavigate } from 'react-router-dom'
import { Plus, PencilSimple, MusicNote } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Loader, EmptyState } from '../../components/ui'
import { categoryLabel } from '../../data/enums'

export default function SongsAdmin() {
  const nav = useNavigate()
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.from('songs').select('*').order('title')
    return data || []
  }, [])

  return (
    <Screen>
      <BackHeader title="Chants" right={
        <button className="tap" onClick={() => nav('/admin/songs/new')} style={{ color: 'var(--cyan-dark)', display: 'flex' }} aria-label="Ajouter">
          <Plus size={26} weight="bold" />
        </button>
      } />
      <div className="pad" style={{ paddingBottom: 30 }}>
        {loading ? <Loader /> : !data.length ? (
          <EmptyState icon={<MusicNote size={42} weight="light" />} title="Répertoire vide" text="Ajoutez le premier chant avec le bouton +." />
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            {data.map((s) => (
              <div key={s.id} className="card row" style={{ padding: 14, gap: 14 }}>
                <div className="center" style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--grad-btn)', flexShrink: 0 }}>
                  <MusicNote size={22} color="#fff" weight="fill" />
                </div>
                <div className="stack grow">
                  <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)' }}>{s.title}</span>
                  <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)' }}>{categoryLabel(s.category)}{s.subtitle ? ` · ${s.subtitle}` : ''}</span>
                </div>
                <button className="tap center" onClick={() => nav(`/admin/songs/${s.id}`)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--field-bg)', color: 'var(--navy)' }} aria-label="Modifier">
                  <PencilSimple size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  )
}
