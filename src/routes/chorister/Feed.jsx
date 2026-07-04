import { useState } from 'react'
import { Heart, ChatCircle, PlusCircle, Plus, Image as ImageIcon } from '@phosphor-icons/react'
import { supabase, publicUrl, uploadFile } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, Sheet, Button, Loader, EmptyState } from '../../components/ui'
import ImageUpload from '../../components/ImageUpload'
import { useToast } from '../../context/ToastContext'
import { timeAgo, initials } from '../../lib/format'

export default function Feed() {
  const { user, profile } = useAuth()
  const { show } = useToast()
  const [composing, setComposing] = useState(false)

  const { data, loading, reload } = useAsync(async () => {
    const { data: posts } = await supabase
      .from('posts')
      .select('*, profiles(full_name, avatar_initials), post_reactions(user_id), post_comments(id)')
      .order('created_at', { ascending: false })
    return posts || []
  }, [])

  const toggleReaction = async (post) => {
    const mine = post.post_reactions?.some((r) => r.user_id === user.id)
    if (mine) {
      await supabase.from('post_reactions').delete().match({ post_id: post.id, user_id: user.id, kind: 'like' })
    } else {
      await supabase.from('post_reactions').insert({ post_id: post.id, user_id: user.id, kind: 'like' })
    }
    reload()
  }

  return (
    <Screen>
      <BackHeader title="Le Fil" right={
        <button className="tap" onClick={() => setComposing(true)} style={{ color: 'var(--cyan-dark)', display: 'flex' }} aria-label="Publier">
          <PlusCircle size={28} weight="fill" />
        </button>
      } />

      <div className="pad" style={{ paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? <Loader /> : !data?.length ? (
          <EmptyState icon={<ImageIcon size={42} weight="light" />} title="Le fil est vide" text="Soyez le premier à partager une nouvelle avec la chorale." />
        ) : data.map((post) => {
          const liked = post.post_reactions?.some((r) => r.user_id === user.id)
          const photo = post.photo_url ? publicUrl('feed-photos', post.photo_url) : null
          return (
            <div key={post.id} className="card" style={{ overflow: 'hidden' }}>
              <div className="row" style={{ gap: 12, padding: 16 }}>
                <Avatar name={post.profiles?.full_name} initials={post.profiles?.avatar_initials} size={40} bg="var(--pink-bg)" color="var(--pink)" />
                <div className="stack">
                  <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{post.profiles?.full_name}</span>
                  <span style={{ font: '400 11px var(--font-ui)', color: 'var(--muted)' }}>{timeAgo(post.created_at)}</span>
                </div>
              </div>
              {post.body && <p style={{ padding: '0 16px 14px', font: '400 14px var(--font-ui)', color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>{post.body}</p>}
              {photo && (/\.(mp4|webm|mov|m4v)($|\?)/i.test(photo)
                ? <video src={photo} controls playsInline style={{ width: '100%', maxHeight: 340, background: '#000' }} />
                : <img src={photo} alt="" style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }} />)}
              <div className="row" style={{ gap: 20, padding: 14 }}>
                <button className="tap row" onClick={() => toggleReaction(post)} style={{ gap: 6, color: liked ? 'var(--red)' : 'var(--muted)' }}>
                  <Heart size={20} weight={liked ? 'fill' : 'regular'} />
                  <span style={{ font: '600 12px var(--font-ui)' }}>{post.post_reactions?.length || 0}</span>
                </button>
                <div className="row" style={{ gap: 6, color: 'var(--muted)' }}>
                  <ChatCircle size={20} />
                  <span style={{ font: '600 12px var(--font-ui)' }}>{post.post_comments?.length || 0}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!composing && (
        <button className="fab tap" onClick={() => setComposing(true)} aria-label="Nouvelle publication">
          <Plus size={26} weight="bold" />
        </button>
      )}

      {composing && (
        <Composer
          profile={profile}
          userId={user.id}
          onClose={() => setComposing(false)}
          onDone={() => { setComposing(false); reload() }}
          notify={show}
        />
      )}
    </Screen>
  )
}

function Composer({ profile, userId, onClose, onDone, notify }) {
  const [body, setBody] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)

  const publish = async () => {
    if (!body.trim() && !file) { notify('Ajoutez un texte ou une photo.', 'error'); return }
    setBusy(true)
    try {
      let photo_url = null
      if (file) {
        const ext = file.name.split('.').pop()
        photo_url = await uploadFile('feed-photos', `${userId}/${Date.now()}.${ext}`, file)
      }
      const { error } = await supabase.from('posts').insert({ author_id: userId, body: body.trim(), photo_url })
      if (error) throw error
      notify('Publication partagée', 'success')
      onDone()
    } catch (e) {
      notify(e.message || 'Erreur de publication', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet title="Nouvelle publication" onClose={onClose}
      footer={<Button variant="primary" onClick={publish} disabled={busy}>{busy ? 'Publication…' : 'Publier'}</Button>}>
      <div className="row" style={{ gap: 12, marginBottom: 14 }}>
        <Avatar name={profile?.full_name} initials={profile?.avatar_initials} size={40} bg="var(--pink-bg)" color="var(--pink)" />
        <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)' }}>{profile?.full_name}</span>
      </div>
      <textarea className="field" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Partagez une nouvelle, une intention, une photo…" style={{ marginBottom: 14, minHeight: 110 }} />
      <ImageUpload onFile={setFile} onError={(m) => notify(m, "error")} accept="image/*,video/*" variant="photo" height={170} label="Ajouter une photo ou une vidéo" />
    </Sheet>
  )
}
