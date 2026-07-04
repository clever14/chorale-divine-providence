import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Heart, ChatCircle, Image as ImageIcon, SealCheck, PaperPlaneTilt, Megaphone } from '@phosphor-icons/react'
import { supabase, publicUrl, uploadFile } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { TabHeader } from '../../components/Layout'
import { Avatar, Sheet, Button, Loader } from '../../components/ui'
import ImageUpload from '../../components/ImageUpload'
import { useToast } from '../../context/ToastContext'
import { timeAgo } from '../../lib/format'

export default function Feed() {
  const { user, profile } = useAuth()
  const { show } = useToast()
  const [params, setParams] = useSearchParams()
  const [composing, setComposing] = useState(false)
  const [commentsPost, setCommentsPost] = useState(null)

  // Ouverture du compositeur via le bouton central "+" de la barre d'onglets.
  useEffect(() => {
    if (params.get('compose')) {
      setComposing(true)
      params.delete('compose')
      setParams(params, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const { data, loading, reload } = useAsync(async () => {
    const { data: posts } = await supabase
      .from('posts')
      .select('*, profiles(full_name, avatar_initials, pupitre, photo_url), post_reactions(user_id), post_comments(id)')
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
    <>
      <TabHeader title="Le Fil" />

      <div className="pad" style={{ paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Compositeur "Partager quelque chose…" */}
        <button className="card tap row" onClick={() => setComposing(true)} style={{ padding: 12, gap: 12, textAlign: 'left' }}>
          <Avatar name={profile?.full_name} initials={profile?.avatar_initials} url={profile?.photo_url} size={38} bg="var(--cyan-soft)" />
          <span className="grow" style={{ font: '400 13.5px var(--font-ui)', color: 'var(--muted)' }}>Partager quelque chose…</span>
          <span className="center" style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(3,159,200,.1)', color: 'var(--cyan-dark)' }}>
            <ImageIcon size={19} weight="fill" />
          </span>
        </button>

        {loading ? <Loader /> : !data?.length ? (
          <div className="center stack" style={{ gap: 10, padding: '46px 30px', textAlign: 'center' }}>
            <div style={{ color: 'var(--cyan-soft)' }}><ImageIcon size={42} weight="light" /></div>
            <div style={{ font: '700 15px var(--font-serif)', color: 'var(--title)' }}>Le fil est vide</div>
            <div style={{ font: '400 13px var(--font-ui)', color: 'var(--muted)', lineHeight: 1.6 }}>Soyez le premier à partager une nouvelle avec la chorale.</div>
          </div>
        ) : data.map((post) => {
          const liked = post.post_reactions?.some((r) => r.user_id === user.id)
          const photo = post.photo_url ? publicUrl('feed-photos', post.photo_url) : null
          const verified = post.is_official || post.profiles?.pupitre === 'chef_choeur'
          const name = post.is_official ? 'Le Chef de chœur' : post.profiles?.full_name
          return (
            <div key={post.id} className="card" style={{ overflow: 'hidden' }}>
              <div className="row" style={{ gap: 12, padding: 16 }}>
                <Avatar name={name} initials={post.profiles?.avatar_initials} url={post.profiles?.photo_url} size={42}
                        bg={post.is_official ? 'var(--navy)' : 'var(--pink-bg)'} color={post.is_official ? '#fff' : 'var(--pink)'} />
                <div className="stack grow">
                  <div className="row" style={{ gap: 6 }}>
                    <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{name}</span>
                    {verified && <SealCheck size={15} weight="fill" color="var(--cyan)" />}
                  </div>
                  <span style={{ font: '400 11px var(--font-ui)', color: 'var(--muted)' }}>
                    {timeAgo(post.created_at)}{post.is_official ? ' · Annonce officielle' : ''}
                  </span>
                </div>
                {post.is_official && <Megaphone size={20} color="var(--cyan-dark)" weight="fill" />}
              </div>

              {post.is_official && post.title && (
                <p style={{ padding: '0 16px 6px', font: '700 15px var(--font-serif)', color: 'var(--title)', margin: 0 }}>{post.title}</p>
              )}
              {post.body && <p style={{ padding: '0 16px 14px', font: '400 14px var(--font-ui)', color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>{post.body}</p>}
              {photo && (/\.(mp4|webm|mov|m4v)($|\?)/i.test(photo)
                ? <video src={photo} controls playsInline style={{ width: '100%', maxHeight: 340, background: '#000' }} />
                : <img src={photo} alt="" style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }} />)}

              <div className="row" style={{ padding: '10px 8px', borderTop: '1px solid var(--border-3)' }}>
                <button className="tap center grow" onClick={() => toggleReaction(post)} style={{ gap: 7, padding: '6px 0', color: liked ? 'var(--red)' : 'var(--body-2)' }}>
                  <Heart size={19} weight={liked ? 'fill' : 'regular'} />
                  <span style={{ font: '600 12.5px var(--font-ui)' }}>Réagir{post.post_reactions?.length ? ` · ${post.post_reactions.length}` : ''}</span>
                </button>
                <button className="tap center grow" onClick={() => setCommentsPost(post)} style={{ gap: 7, padding: '6px 0', color: 'var(--body-2)' }}>
                  <ChatCircle size={19} />
                  <span style={{ font: '600 12.5px var(--font-ui)' }}>Commenter{post.post_comments?.length ? ` · ${post.post_comments.length}` : ''}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {composing && (
        <Composer
          profile={profile}
          userId={user.id}
          onClose={() => setComposing(false)}
          onDone={() => { setComposing(false); reload() }}
          notify={show}
        />
      )}

      {commentsPost && (
        <CommentsSheet
          post={commentsPost}
          userId={user.id}
          profile={profile}
          onClose={() => setCommentsPost(null)}
          onChanged={reload}
          notify={show}
        />
      )}
    </>
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
        <Avatar name={profile?.full_name} initials={profile?.avatar_initials} url={profile?.photo_url} size={40} bg="var(--cyan-soft)" />
        <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)' }}>{profile?.full_name}</span>
      </div>
      <textarea className="field" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Partagez une nouvelle, une intention, une photo…" style={{ marginBottom: 14, minHeight: 110 }} />
      <ImageUpload onFile={setFile} onError={(m) => notify(m, 'error')} accept="image/*,video/*" variant="photo" height={170} label="Ajouter une photo ou une vidéo" />
    </Sheet>
  )
}

function CommentsSheet({ post, userId, profile, onClose, onChanged, notify }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const { data, loading, reload } = useAsync(async () => {
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles(full_name, avatar_initials, photo_url)')
      .eq('post_id', post.id)
      .order('created_at')
    return data || []
  }, [post.id])

  const send = async () => {
    const body = text.trim()
    if (!body) return
    setBusy(true)
    const { error } = await supabase.from('post_comments').insert({ post_id: post.id, author_id: userId, body })
    setBusy(false)
    if (error) { notify(error.message, 'error'); return }
    setText('')
    reload()
    onChanged?.()
  }

  return (
    <Sheet title="Commentaires" onClose={onClose}
      footer={
        <div className="row" style={{ gap: 10 }}>
          <input className="field" value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Écrire un commentaire…" style={{ borderRadius: 22 }} />
          <button className="tap center" onClick={send} disabled={busy || !text.trim()} style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--grad-btn-cyan)', flexShrink: 0 }} aria-label="Envoyer">
            <PaperPlaneTilt size={19} color="#fff" weight="fill" />
          </button>
        </div>
      }>
      {loading ? <Loader /> : !data.length ? (
        <div className="center stack" style={{ gap: 6, padding: '30px 20px', textAlign: 'center' }}>
          <ChatCircle size={32} weight="light" color="var(--cyan-soft)" />
          <span style={{ font: '400 13px var(--font-ui)', color: 'var(--muted)' }}>Aucun commentaire. Soyez le premier.</span>
        </div>
      ) : (
        <div className="stack" style={{ gap: 14, paddingBottom: 4 }}>
          {data.map((c) => (
            <div key={c.id} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              <Avatar name={c.profiles?.full_name} initials={c.profiles?.avatar_initials} url={c.profiles?.photo_url} size={34} bg="var(--pink-bg)" color="var(--pink)" />
              <div className="stack grow" style={{ background: 'var(--field-bg)', borderRadius: 14, padding: '10px 14px' }}>
                <div className="spread">
                  <span style={{ font: '700 12.5px var(--font-ui)', color: 'var(--title)' }}>{c.profiles?.full_name}</span>
                  <span style={{ font: '400 10.5px var(--font-ui)', color: 'var(--muted)' }}>{timeAgo(c.created_at)}</span>
                </div>
                <span style={{ font: '400 13px var(--font-ui)', color: 'var(--body)', lineHeight: 1.5, marginTop: 2 }}>{c.body}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  )
}
