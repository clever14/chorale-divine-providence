import { useParams } from 'react-router-dom'
import { EnvelopeSimple, Phone } from '@phosphor-icons/react'
import { supabase, publicUrl } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, Loader, EmptyState } from '../../components/ui'
import { pupitreLabel } from '../../data/enums'
import { timeAgo } from '../../lib/format'

export default function MemberPublic() {
  const { id } = useParams()

  const { data, loading } = useAsync(async () => {
    const [{ data: prof }, { data: posts }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('posts').select('*').eq('author_id', id).order('created_at', { ascending: false }).limit(10)
    ])
    return { prof, posts: posts || [] }
  }, [id])

  if (loading) return <Screen><Loader /></Screen>
  if (!data?.prof) return <Screen><BackHeader /><EmptyState title="Membre introuvable" /></Screen>
  const p = data.prof

  return (
    <Screen>
      <BackHeader />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <div style={{ background: 'var(--grad-banner)', borderRadius: 20, padding: 22, color: '#fff', display: 'flex', gap: 16, alignItems: 'center', marginBottom: 22 }}>
          <Avatar name={p.full_name} initials={p.avatar_initials} url={p.photo_url} size={72} bg="rgba(255,255,255,.15)" color="#fff" />
          <div className="stack">
            <span style={{ font: '700 20px var(--font-serif)' }}>{p.full_name}</span>
            <span style={{ font: '400 12.5px var(--font-ui)', color: 'var(--cyan-light)' }}>{pupitreLabel(p.pupitre)}</span>
          </div>
        </div>

        <div className="row" style={{ gap: 10, marginBottom: 20 }}>
          {p.email && (
            <a href={`mailto:${p.email}`} className="btn btn-ghost tap" style={{ flex: 1 }}>
              <EnvelopeSimple size={18} weight="bold" /> Email
            </a>
          )}
          {p.phone && (
            <a href={`tel:${p.phone}`} className="btn btn-cyan tap" style={{ flex: 1 }}>
              <Phone size={18} weight="bold" /> Appeler
            </a>
          )}
        </div>

        <span className="label" style={{ display: 'block', marginBottom: 10 }}>Publications</span>
        {!data.posts.length ? (
          <EmptyState title="Aucune publication" />
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            {data.posts.map((post) => {
              const photo = post.photo_url ? publicUrl('feed-photos', post.photo_url) : null
              return (
                <div key={post.id} className="card" style={{ overflow: 'hidden' }}>
                  {post.body && <p style={{ padding: 14, font: '400 13.5px var(--font-ui)', color: 'var(--body)', margin: 0, lineHeight: 1.6 }}>{post.body}</p>}
                  {photo && <img src={photo} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover' }} />}
                  <div style={{ padding: '10px 14px', font: '400 11px var(--font-ui)', color: 'var(--muted)' }}>{timeAgo(post.created_at)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Screen>
  )
}
