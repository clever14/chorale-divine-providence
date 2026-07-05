import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Plus, Trash, CalendarBlank } from '@phosphor-icons/react'
import { supabase, publicUrl } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Loader, EmptyState } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { longDate } from '../../lib/format'

// Vrai média non-image (vidéo/audio) : on n'en fait pas une vignette.
const isMedia = (u) => /\.(mp4|webm|mov|m4v|avi|mkv|mp3|m4a|wav|ogg|aac|flac)($|\?)/i.test(u)

export default function AdminAnnouncements() {
  const nav = useNavigate()
  const { show } = useToast()
  const [items, setItems] = useState([])
  const [confirmId, setConfirmId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const { data, loading } = useAsync(async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, title, body, photo_url, created_at')
      .eq('is_official', true)
      .order('created_at', { ascending: false })
    return data || []
  }, [])

  useEffect(() => { if (data) setItems(data) }, [data])

  const remove = async (id) => {
    setBusyId(id)
    // Supprimer le post « officiel » le retire du Fil pour tous les membres.
    const { error } = await supabase.from('posts').delete().eq('id', id)
    setBusyId(null)
    setConfirmId(null)
    if (error) { show('Suppression impossible.', 'error'); return }
    setItems((list) => list.filter((p) => p.id !== id))
    show('Annonce supprimée', 'success')
  }

  return (
    <Screen>
      <BackHeader title="Annonces" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <button className="btn btn-primary tap" onClick={() => nav('/admin/announcement')} style={{ marginBottom: 18 }}>
          <Plus size={18} weight="bold" /> Nouvelle annonce
        </button>

        {loading ? <Loader /> : !items.length ? (
          <EmptyState icon={<Megaphone size={40} weight="light" />} title="Aucune annonce publiée"
            text="Les annonces que tu publies apparaîtront ici. Tu pourras les retirer du Fil quand la date est passée." />
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            {items.map((a) => {
              const media = a.photo_url ? publicUrl('feed-photos', a.photo_url) : null
              const thumb = media && !isMedia(media) ? media : null
              return (
                <div key={a.id} className="card" style={{ padding: 14 }}>
                  <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                    {thumb ? (
                      <img src={thumb} alt="" style={{ width: 54, height: 54, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div className="center" style={{ width: 54, height: 54, borderRadius: 12, background: 'rgba(3,159,200,.1)', color: 'var(--cyan-dark)', flexShrink: 0 }}>
                        <Megaphone size={22} weight="fill" />
                      </div>
                    )}
                    <div className="stack grow" style={{ minWidth: 0, gap: 3 }}>
                      {a.title && <span style={{ font: '700 14px var(--font-serif)', color: 'var(--title)' }}>{a.title}</span>}
                      {a.body && <span style={{ font: '400 12.5px var(--font-ui)', color: 'var(--body-2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.body}</span>}
                      <span className="row" style={{ gap: 5, font: '400 11px var(--font-ui)', color: 'var(--muted)', marginTop: 2 }}>
                        <CalendarBlank size={13} /> {longDate(a.created_at)}
                      </span>
                    </div>
                  </div>

                  {confirmId === a.id ? (
                    <div className="row" style={{ gap: 8, marginTop: 12 }}>
                      <span className="grow" style={{ font: '600 12.5px var(--font-ui)', color: 'var(--red)' }}>Supprimer cette annonce ?</span>
                      <button className="tap" onClick={() => setConfirmId(null)} disabled={busyId === a.id} style={{ font: '600 12.5px var(--font-ui)', color: 'var(--body-2)', padding: '6px 12px' }}>Annuler</button>
                      <button className="tap" onClick={() => remove(a.id)} disabled={busyId === a.id} style={{ font: '700 12.5px var(--font-ui)', color: '#fff', background: 'var(--red)', padding: '7px 14px', borderRadius: 10 }}>
                        {busyId === a.id ? '…' : 'Supprimer'}
                      </button>
                    </div>
                  ) : (
                    <button className="row tap" onClick={() => setConfirmId(a.id)} style={{ gap: 7, marginTop: 12, color: 'var(--red)', font: '600 12.5px var(--font-ui)' }}>
                      <Trash size={16} /> Supprimer
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Screen>
  )
}
