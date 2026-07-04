import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PaperPlaneTilt, Phone, CaretLeft } from '@phosphor-icons/react'
import { supabase, publicUrl } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, Loader, EmptyState } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { pupitreLabel } from '../../data/enums'
import { timeAgo } from '../../lib/format'

export default function MemberPublic() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const { show } = useToast()
  const [starting, setStarting] = useState(false)

  const { data, loading } = useAsync(async () => {
    const [{ data: prof }, { data: posts }, { data: att }, { data: com }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('posts').select('*').eq('author_id', id).order('created_at', { ascending: false }).limit(10),
      supabase.from('event_attendance').select('status').eq('user_id', id),
      supabase.from('chorist_of_month').select('user_id, month').order('month', { ascending: false }).limit(1).maybeSingle()
    ])
    const rows = att || []
    const present = rows.filter((r) => r.status === 'present').length
    const pct = rows.length ? Math.round((present / rows.length) * 100) : null
    const isCom = com?.user_id === id
    return { prof, posts: posts || [], pct, isCom }
  }, [id])

  const startConversation = async () => {
    setStarting(true)
    try {
      const { data: convId, error } = await supabase.rpc('get_or_create_direct_conversation', { p_other: id })
      if (error) throw error
      nav(`/messages/${convId}`)
    } catch (e) {
      show("Impossible d'ouvrir la conversation.", 'error')
    } finally {
      setStarting(false)
    }
  }

  if (loading) return <Screen><Loader /></Screen>
  if (!data?.prof) return <Screen><BackHeader /><EmptyState title="Membre introuvable" /></Screen>
  const p = data.prof
  const isSelf = p.id === user.id

  return (
    <Screen noStatusBar>
      <div>
        {/* En-tête bleu avec flèche retour superposée */}
        <div style={{ position: 'relative', background: 'var(--grad-banner)', padding: '18px 20px 24px', color: '#fff', textAlign: 'center' }}>
          <div className="statusbar-spacer" />
          <button className="tap" onClick={() => nav(-1)} aria-label="Retour"
            style={{ position: 'absolute', left: 16, top: 'calc(16px + var(--safe-top))', color: '#fff', display: 'flex', zIndex: 2 }}>
            <CaretLeft size={24} weight="bold" />
          </button>
          <div style={{ display: 'inline-block', borderRadius: '50%', padding: 4, background: 'rgba(255,255,255,.12)', border: '2px solid rgba(255,255,255,.4)' }}>
            <Avatar name={p.full_name} initials={p.avatar_initials} url={p.photo_url} size={92} bg="var(--pink-bg)" color="var(--pink)" />
          </div>
          <div style={{ font: '700 22px var(--font-serif)', marginTop: 12 }}>{p.full_name}</div>
          <div className="center" style={{ gap: 8, marginTop: 10 }}>
            <span style={{ font: '700 11px var(--font-ui)', letterSpacing: .5, textTransform: 'uppercase', background: 'var(--cyan)', color: '#fff', padding: '5px 12px', borderRadius: 20 }}>{pupitreLabel(p.pupitre)}</span>
            <span className="row" style={{ gap: 6, font: '700 11px var(--font-ui)', letterSpacing: .5, textTransform: 'uppercase', background: 'rgba(255,255,255,.14)', color: '#fff', padding: '5px 12px', borderRadius: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--whatsapp)' }} /> Actif
            </span>
          </div>
        </div>

        <div className="pad" style={{ paddingTop: 18, paddingBottom: 30 }}>
          {/* Actions */}
          {!isSelf && (
            <div className="row" style={{ gap: 10, marginBottom: 18 }}>
              <button className="btn btn-primary tap grow" onClick={startConversation} disabled={starting}>
                <PaperPlaneTilt size={18} weight="fill" /> {starting ? 'Ouverture…' : 'Envoyer un message'}
              </button>
              {p.phone && (
                <a href={`tel:${p.phone}`} className="tap center" style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(3,159,200,.1)', color: 'var(--cyan-dark)', flexShrink: 0 }} aria-label="Appeler">
                  <Phone size={20} weight="fill" />
                </a>
              )}
            </div>
          )}

          {/* Statistiques */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            <div className="card center stack" style={{ padding: '16px 8px', gap: 3 }}>
              <span style={{ font: '700 24px var(--font-serif)', color: 'var(--navy)' }}>{data.pct === null ? '—' : `${data.pct}%`}</span>
              <span style={{ font: '600 10.5px var(--font-ui)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5 }}>Taux de présence</span>
            </div>
            <div className="card center stack" style={{ padding: '16px 8px', gap: 3 }}>
              {data.isCom ? (
                <>
                  <span style={{ font: '700 24px var(--font-serif)', color: 'var(--gold-dark)' }}>{p.avatar_initials || '★'}</span>
                  <span style={{ font: '600 10.5px var(--font-ui)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5 }}>Choriste du mois</span>
                </>
              ) : (
                <>
                  <span style={{ font: '700 18px var(--font-serif)', color: 'var(--navy)' }}>{pupitreLabel(p.pupitre)}</span>
                  <span style={{ font: '600 10.5px var(--font-ui)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5 }}>Pupitre</span>
                </>
              )}
            </div>
          </div>

          <span className="label" style={{ display: 'block', marginBottom: 10 }}>Publications récentes</span>
          {!data.posts.length ? (
            <EmptyState title="Aucune publication" />
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {data.posts.map((post) => {
                const photo = post.photo_url ? publicUrl('feed-photos', post.photo_url) : null
                return (
                  <div key={post.id} className="card" style={{ overflow: 'hidden' }}>
                    {post.body && <p style={{ padding: 14, font: '400 13.5px var(--font-ui)', color: 'var(--body)', margin: 0, lineHeight: 1.6 }}>{post.body}</p>}
                    {photo && !/\.(mp4|webm|mov|m4v)($|\?)/i.test(photo) && <img src={photo} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover' }} />}
                    <div style={{ padding: '10px 14px', font: '400 11px var(--font-ui)', color: 'var(--muted)' }}>{timeAgo(post.created_at)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Screen>
  )
}
