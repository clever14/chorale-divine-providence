import { useNavigate } from 'react-router-dom'
import { Plus, PencilSimple, Scroll, Eye } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Loader, EmptyState } from '../../components/ui'

export default function ReglementAdmin() {
  const nav = useNavigate()
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.from('reglement_articles').select('*').order('num')
    return data || []
  }, [])

  return (
    <Screen>
      <BackHeader title="Règlement" right={
        <button className="tap" onClick={() => nav('/admin/reglement/new')} style={{ color: 'var(--cyan-dark)', display: 'flex' }} aria-label="Ajouter">
          <Plus size={26} weight="bold" />
        </button>
      } />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <div className="row" style={{ gap: 10, padding: 14, background: 'rgba(3,159,200,.08)', borderRadius: 14, marginBottom: 18 }}>
          <Eye size={20} color="var(--cyan-dark)" weight="fill" />
          <span style={{ font: '500 12.5px var(--font-ui)', color: 'var(--body-2)' }}>Visible par tous les choristes</span>
        </div>

        {loading ? <Loader /> : !data.length ? (
          <EmptyState icon={<Scroll size={42} weight="light" />} title="Aucun article" text="Ajoutez le premier avec le bouton +." />
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {data.map((a) => (
              <div key={a.id} className="card row" style={{ padding: 14, gap: 12 }}>
                <div className="center" style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--field-bg)', font: '700 13px var(--font-serif)', color: 'var(--navy)', flexShrink: 0 }}>{a.num}</div>
                <div className="stack grow">
                  <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)' }}>{a.title}</span>
                  <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.body}</span>
                </div>
                <button className="tap center" onClick={() => nav(`/admin/reglement/${a.id}`)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--field-bg)', color: 'var(--navy)' }} aria-label="Modifier">
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
