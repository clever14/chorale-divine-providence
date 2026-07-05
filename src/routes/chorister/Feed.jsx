import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Heart, ChatCircle, Image as ImageIcon, SealCheck, PaperPlaneTilt,
  BookmarkSimple, DotsThree, MicrophoneStage, VideoCamera, MusicNote, Trash
} from '@phosphor-icons/react'
import { supabase, publicUrl, uploadFile } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { TabHeader } from '../../components/Layout'
import { Avatar, Sheet, Button, Loader } from '../../components/ui'
import AudioPlayer from '../../components/AudioPlayer'
import { useToast } from '../../context/ToastContext'
import { timeAgo } from '../../lib/format'

// Détection du type de média d'après l'extension du fichier stocké.
const isVideo = (u) => /\.(mp4|webm|mov|m4v|avi|mkv)($|\?)/i.test(u)
const isAudio = (u) => /\.(mp3|m4a|wav|ogg|aac|flac)($|\?)/i.test(u)

// Sélection commune (profil auteur + rôle pour le badge + compteurs).
// NB : `profiles!author_id` lève l'ambiguïté « more than one relationship » —
// on force le lien direct posts.author_id -> profiles (la table post_bookmarks
// introduit sinon une 2e relation posts <-> profiles vue comme du many-to-many).
const POST_SELECT =
  '*, profiles!author_id(full_name, avatar_initials, pupitre, photo_url, role), post_reactions(user_id), post_comments(id)'

// Normalise une ligne serveur en objet prêt pour l'affichage + mises à jour optimistes.
function normalize(post, uid) {
  return {
    ...post,
    _liked: post.post_reactions?.some((r) => r.user_id === uid) || false,
    _reactions: post.post_reactions?.length || 0,
    _comments: post.post_comments?.length || 0,
    _saved: post.post_bookmarks?.some((b) => b.user_id === uid) || false
  }
}

export default function Feed() {
  const { user, profile, isAdmin } = useAuth()
  const nav = useNavigate()
  const { show } = useToast()
  const [params, setParams] = useSearchParams()
  const [composing, setComposing] = useState(false)
  const [commentsPost, setCommentsPost] = useState(null)
  const [menuFor, setMenuFor] = useState(null)
  const [posts, setPosts] = useState([])

  // Ouverture du compositeur via le bouton central "+" de la barre d'onglets.
  useEffect(() => {
    if (params.get('compose')) {
      setComposing(true)
      params.delete('compose')
      setParams(params, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const { data, loading } = useAsync(async () => {
    // Tentative avec les enregistrements (nécessite la migration 0004).
    let res = await supabase
      .from('posts')
      .select(`${POST_SELECT}, post_bookmarks(user_id)`)
      .order('created_at', { ascending: false })
    // Repli si la table post_bookmarks n'existe pas encore (migration non exécutée).
    if (res.error) {
      res = await supabase.from('posts').select(POST_SELECT).order('created_at', { ascending: false })
    }
    if (res.error) throw res.error
    return res.data || []
  }, [])

  useEffect(() => {
    if (data) setPosts(data.map((p) => normalize(p, user.id)))
  }, [data, user.id])

  // Met à jour une seule publication dans la liste locale.
  const patch = (id, changes) =>
    setPosts((list) => list.map((p) => (p.id === id ? { ...p, ...changes } : p)))

  // Réaction "J'aime" (optimiste : l'écran répond immédiatement, la base suit).
  const toggleReaction = async (post) => {
    const liked = !post._liked
    patch(post.id, { _liked: liked, _reactions: post._reactions + (liked ? 1 : -1) })
    const q = liked
      ? supabase.from('post_reactions').insert({ post_id: post.id, user_id: user.id, kind: 'like' })
      : supabase.from('post_reactions').delete().match({ post_id: post.id, user_id: user.id, kind: 'like' })
    const { error } = await q
    if (error) {
      patch(post.id, { _liked: post._liked, _reactions: post._reactions }) // revient en arrière
      show('Action impossible pour le moment.', 'error')
    }
  }

  // Enregistrer / retirer des enregistrements.
  const toggleBookmark = async (post) => {
    const saved = !post._saved
    patch(post.id, { _saved: saved })
    const q = saved
      ? supabase.from('post_bookmarks').insert({ post_id: post.id, user_id: user.id })
      : supabase.from('post_bookmarks').delete().match({ post_id: post.id, user_id: user.id })
    const { error } = await q
    if (error) {
      patch(post.id, { _saved: post._saved })
      show("Enregistrement indisponible (migration à exécuter ?).", 'error')
    }
  }

  const deletePost = async (post) => {
    const snapshot = posts
    setPosts((list) => list.filter((p) => p.id !== post.id))
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (error) {
      setPosts(snapshot)
      show('Suppression impossible.', 'error')
    } else {
      show('Publication supprimée', 'success')
    }
  }

  // Ajout instantané en tête de fil après publication (logique façon Facebook).
  const onPublished = (row) => {
    setComposing(false)
    if (row) setPosts((list) => [normalize(row, user.id), ...list])
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

        {loading ? <Loader /> : !posts.length ? (
          <div className="center stack" style={{ gap: 10, padding: '46px 30px', textAlign: 'center' }}>
            <div style={{ color: 'var(--cyan-soft)' }}><ImageIcon size={42} weight="light" /></div>
            <div style={{ font: '700 15px var(--font-serif)', color: 'var(--title)' }}>Le fil est vide</div>
            <div style={{ font: '400 13px var(--font-ui)', color: 'var(--muted)', lineHeight: 1.6 }}>Soyez le premier à partager une nouvelle avec la chorale.</div>
          </div>
        ) : posts.map((post) => {
          const photo = post.photo_url ? publicUrl('feed-photos', post.photo_url) : null
          const verified = post.is_official || post.profiles?.role === 'admin' || post.profiles?.pupitre === 'chef_choeur'
          const name = post.is_official ? 'Le Chef de chœur' : post.profiles?.full_name
          const canManage = post.author_id === user.id || isAdmin
          // Texte de résumé "X réactions · Y commentaires".
          const parts = []
          if (post._reactions > 0) parts.push(`${post._reactions} réaction${post._reactions > 1 ? 's' : ''}`)
          if (post._comments > 0) parts.push(`${post._comments} commentaire${post._comments > 1 ? 's' : ''}`)
          const summary = parts.join(' · ')

          return (
            <div key={post.id} className="card" style={{ overflow: 'hidden' }}>
              {/* En-tête : avatar + auteur (cliquable si choriste) + menu */}
              <div className="row" style={{ gap: 12, padding: 16 }}>
                {post.is_official ? (
                  <div className="center" style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--navy)', color: '#fff', flexShrink: 0 }}>
                    <MicrophoneStage size={22} weight="fill" />
                  </div>
                ) : (
                  <button className="tap" onClick={() => nav(`/members/${post.author_id}`)} aria-label={`Profil de ${name}`} style={{ display: 'flex', flexShrink: 0 }}>
                    <Avatar name={name} initials={post.profiles?.avatar_initials} url={post.profiles?.photo_url} size={42} bg="var(--pink-bg)" color="var(--pink)" />
                  </button>
                )}

                <button
                  className="stack grow tap"
                  onClick={() => !post.is_official && nav(`/members/${post.author_id}`)}
                  style={{ textAlign: 'left', alignItems: 'flex-start', cursor: post.is_official ? 'default' : 'pointer' }}
                  aria-label={post.is_official ? name : `Profil de ${name}`}
                >
                  <div className="row" style={{ gap: 6 }}>
                    <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{name}</span>
                    {verified && <SealCheck size={15} weight="fill" color="var(--cyan)" />}
                  </div>
                  <span style={{ font: '400 11px var(--font-ui)', color: 'var(--muted)' }}>
                    {timeAgo(post.created_at)}{post.is_official ? ' · Annonce officielle' : ''}
                  </span>
                </button>

                {canManage && (
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button className="tap" onClick={() => setMenuFor(menuFor === post.id ? null : post.id)} aria-label="Options de la publication" style={{ color: 'var(--muted)', display: 'flex' }}>
                      <DotsThree size={24} weight="bold" />
                    </button>
                    {menuFor === post.id && (
                      <>
                        <div onClick={() => setMenuFor(null)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
                        <div className="card" style={{ position: 'absolute', right: 0, top: 30, zIndex: 61, minWidth: 172, padding: 6, boxShadow: 'var(--sh-card-2)' }}>
                          <button className="row tap" onClick={() => { setMenuFor(null); deletePost(post) }} style={{ gap: 10, padding: '10px 12px', width: '100%', color: 'var(--red)' }}>
                            <Trash size={18} /> <span style={{ font: '600 13px var(--font-ui)' }}>Supprimer</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Corps */}
              {post.is_official && post.title && (
                <p style={{ padding: '0 16px 6px', font: '700 15px var(--font-serif)', color: 'var(--title)', margin: 0 }}>{post.title}</p>
              )}
              {post.body && <p style={{ padding: '0 16px 14px', font: '400 14px var(--font-ui)', color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>{post.body}</p>}

              {/* Média : format d'origine conservé (aucun rognage) */}
              {photo && (
                isVideo(photo) ? (
                  <video src={photo} controls playsInline style={{ width: '100%', maxHeight: 520, background: '#000', display: 'block' }} />
                ) : isAudio(photo) ? (
                  <div style={{ padding: '4px 16px 16px' }}><AudioPlayer src={photo} /></div>
                ) : (
                  <img src={photo} alt="" style={{ width: '100%', height: 'auto', display: 'block', background: 'var(--field-bg)' }} />
                )
              )}

              {/* Résumé réactions / commentaires */}
              {summary && (
                <button className="row tap" onClick={() => setCommentsPost(post)} style={{ gap: 7, padding: '12px 16px 4px', width: '100%' }}>
                  {post._reactions > 0 && (
                    <span className="center" style={{ width: 21, height: 21, borderRadius: '50%', background: 'var(--red)', color: '#fff', border: '2px solid var(--card-bg)' }}>
                      <Heart size={11} weight="fill" />
                    </span>
                  )}
                  <span style={{ font: '500 12px var(--font-ui)', color: 'var(--muted)' }}>{summary}</span>
                </button>
              )}

              {/* Barre d'actions */}
              <div className="row" style={{ padding: '8px 8px', borderTop: '1px solid var(--border-3)' }}>
                <button className="tap center grow" onClick={() => toggleReaction(post)} style={{ gap: 7, padding: '6px 0', color: post._liked ? 'var(--red)' : 'var(--body-2)' }}>
                  <Heart size={19} weight={post._liked ? 'fill' : 'regular'} />
                  <span style={{ font: '600 12.5px var(--font-ui)' }}>Réagir</span>
                </button>
                <button className="tap center grow" onClick={() => setCommentsPost(post)} style={{ gap: 7, padding: '6px 0', color: 'var(--body-2)' }}>
                  <ChatCircle size={19} />
                  <span style={{ font: '600 12.5px var(--font-ui)' }}>Commenter</span>
                </button>
                <button className="tap center" onClick={() => toggleBookmark(post)} aria-label={post._saved ? 'Retirer des enregistrements' : 'Enregistrer'} style={{ width: 44, padding: '6px 0', color: post._saved ? 'var(--cyan-dark)' : 'var(--body-2)' }}>
                  <BookmarkSimple size={20} weight={post._saved ? 'fill' : 'regular'} />
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
          isAdmin={isAdmin}
          onClose={() => setComposing(false)}
          onPublished={onPublished}
          notify={show}
        />
      )}

      {commentsPost && (
        <CommentsSheet
          post={commentsPost}
          userId={user.id}
          onClose={() => setCommentsPost(null)}
          onAdded={(id) => setPosts((list) => list.map((p) => (p.id === id ? { ...p, _comments: p._comments + 1 } : p)))}
          notify={show}
        />
      )}
    </>
  )
}

/* ---------------------------------------------------------------- Compositeur */
function Composer({ profile, userId, isAdmin, onClose, onPublished, notify }) {
  const [body, setBody] = useState('')
  const [file, setFile] = useState(null)
  const [mediaType, setMediaType] = useState(null) // 'photo' | 'video' | 'audio'
  const [previewUrl, setPreviewUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const inputs = { photo: useRef(null), video: useRef(null), audio: useRef(null) }

  // Types disponibles : Photo pour tous ; Vidéo + Chant réservés à l'administrateur.
  const TYPES = [
    { key: 'photo', label: 'Photo', Icon: ImageIcon, accept: 'image/*', limit: 15 },
    ...(isAdmin ? [
      { key: 'video', label: 'Vidéo', Icon: VideoCamera, accept: 'video/*', limit: 200 },
      { key: 'audio', label: 'Chant', Icon: MusicNote, accept: 'audio/*', limit: 50 }
    ] : [])
  ]

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const choose = (type) => inputs[type].current?.click()

  const onFile = (type, f) => {
    if (!f) return
    const t = TYPES.find((x) => x.key === type)
    if (f.size > t.limit * 1024 * 1024) {
      notify(`Fichier trop volumineux (max ${t.limit} Mo).`, 'error')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setMediaType(type)
    setFile(f)
    setPreviewUrl(type === 'audio' ? null : URL.createObjectURL(f))
  }

  const clearMedia = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null); setMediaType(null); setPreviewUrl(null)
  }

  const publish = async () => {
    if (!body.trim() && !file) { notify('Ajoutez un texte ou un média.', 'error'); return }
    setBusy(true)
    try {
      let photo_url = null
      if (file) {
        const ext = file.name.split('.').pop()
        photo_url = await uploadFile('feed-photos', `${userId}/${Date.now()}.${ext}`, file)
      }
      const { data: row, error } = await supabase
        .from('posts')
        .insert({ author_id: userId, body: body.trim(), photo_url })
        .select(POST_SELECT)
        .single()
      if (error) throw error
      notify('Publication partagée', 'success')
      onPublished(row)
    } catch (e) {
      notify(e.message || 'Erreur de publication', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet title="Nouvelle publication" onClose={onClose}
      footer={<Button variant="primary" onClick={publish} disabled={busy}><PaperPlaneTilt size={18} weight="fill" /> {busy ? 'Publication…' : 'Publier'}</Button>}>
      <div className="row" style={{ gap: 12, marginBottom: 12 }}>
        <Avatar name={profile?.full_name} initials={profile?.avatar_initials} url={profile?.photo_url} size={40} bg="var(--cyan-soft)" />
        <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)' }}>{profile?.full_name}</span>
      </div>

      <textarea className="field" value={body} onChange={(e) => setBody(e.target.value)}
        placeholder="Partage un mot avec la chorale…" style={{ marginBottom: 14, minHeight: 96 }} />

      {/* Inputs cachés (un par type autorisé) */}
      {TYPES.map((t) => (
        <input key={t.key} ref={inputs[t.key]} type="file" accept={t.accept} hidden
          onChange={(e) => onFile(t.key, e.target.files?.[0])} />
      ))}

      {/* Aperçu du média choisi */}
      {file && (
        <div className="card" style={{ overflow: 'hidden', marginBottom: 14, position: 'relative' }}>
          <button className="tap center" onClick={clearMedia} aria-label="Retirer le média"
            style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, width: 30, height: 30, borderRadius: '50%', background: 'rgba(4,12,32,.55)', color: '#fff' }}>
            <Trash size={15} />
          </button>
          {mediaType === 'photo' && <img src={previewUrl} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />}
          {mediaType === 'video' && <video src={previewUrl} controls playsInline style={{ width: '100%', maxHeight: 300, background: '#000', display: 'block' }} />}
          {mediaType === 'audio' && (
            <div className="row" style={{ gap: 12, padding: 16 }}>
              <span className="center" style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(3,159,200,.1)', color: 'var(--cyan-dark)', flexShrink: 0 }}>
                <MusicNote size={22} weight="fill" />
              </span>
              <span className="grow" style={{ font: '600 13px var(--font-ui)', color: 'var(--body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Boutons de type de média */}
      <div className="row" style={{ gap: 10 }}>
        {TYPES.map((t) => {
          const active = mediaType === t.key
          return (
            <button key={t.key} className="tap center grow" onClick={() => choose(t.key)}
              style={{
                gap: 8, padding: '12px 8px', borderRadius: 13,
                border: `1.5px solid ${active ? 'var(--cyan)' : 'var(--border)'}`,
                background: active ? 'rgba(3,159,200,.06)' : 'var(--field-bg)',
                color: active ? 'var(--cyan-dark)' : 'var(--body-2)'
              }}>
              <t.Icon size={19} weight={active ? 'fill' : 'regular'} />
              <span style={{ font: '600 12.5px var(--font-ui)' }}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

/* ---------------------------------------------------------------- Commentaires */
function CommentsSheet({ post, userId, onClose, onAdded, notify }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const { data, loading, reload } = useAsync(async () => {
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles!author_id(full_name, avatar_initials, photo_url)')
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
    onAdded?.(post.id)
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
