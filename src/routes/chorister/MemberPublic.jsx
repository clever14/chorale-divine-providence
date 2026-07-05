import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PaperPlaneTilt, Phone, CaretLeft, DotsThree, IdentificationCard, EnvelopeSimple, MusicNote } from '@phosphor-icons/react'
import { supabase, publicUrl } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, Loader, EmptyState, Sheet } from '../../components/ui'
import AudioPlayer from '../../components/AudioPlayer'
import { useToast } from '../../context/ToastContext'
import { pupitreLabel } from '../../data/enums'
import { timeAgo, monthName } from '../../lib/format'
import { isSyntheticEmail } from '../../lib/config'

const isVideo = (u) => /\.(mp4|webm|mov|m4v|avi|mkv)($|\?)/i.test(u)
const isAudio = (u) => /\.(mp3|m4a|wav|ogg|aac|flac)($|\?)/i.test(u)

export default function MemberPublic() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const { show } = useToast()
  const [starting, setStarting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [coordsOpen, setCoordsOpen] = useState(false)

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
    return { prof, posts: posts || [], pct, isCom, comMonth: com?.month }
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
  // Email réel de contact (jamais l'email synthétique dérivé du téléphone).
  const realEmail = p.contact_email || (isSyntheticEmail(p.email) ? null : p.email)

  return (
    <Screen noStatusBar>
      <div>
        {/* En-tête bleu : flèche retour (gauche) + menu "…" (droite) */}
        <div style={{ position: 'relative', background: 'var(--grad-banner)', padding: '18px 20px 24px', color: '#fff', textAlign: 'center' }}>
          <div className="statusbar-spacer" />
          <button className="tap" onClick={() => nav(-1)} aria-label="Retour"
            style={{ position: 'absolute', left: 16, top: 'calc(16px + var(--safe-top))', color: '#fff', display: 'flex', zIndex: 2 }}>
            <CaretLeft size={24} weight="bold" />
          </button>

          <button className="tap" onClick={() => setMenuOpen((v) => !v)} aria-label="Options"
            style={{ position: 'absolute', right: 16, top: 'calc(16px + var(--safe-top))', color: '#fff', display: 'flex', zIndex: 3 }}>
            <DotsThree size={26} weight="bold" />
          </button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 3 }} />
              <div className="card" style={{ position: 'absolute', right: 16, top: 'calc(50px + var(--safe-top))', zIndex: 4, minWidth: 200, padding: 6, boxShadow: 'var(--sh-card-2)' }}>
                <button className="row tap" onClick={() => { setMenuOpen(false); setCoordsOpen(true) }}
                  style={{ gap: 10, padding: '11px 12px', width: '100%', color: 'var(--title)' }}>
                  <IdentificationCard size={19} color="var(--cyan-dark)" />
                  <span style={{ font: '600 13px var(--font-ui)' }}>Voir les coordonnées</span>
                </button>
              </div>
            </>
          )}

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
                  <span style={{ font: '600 10.5px var(--font-ui)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5 }}>Choriste de {monthName(data.comMonth)}</span>
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
                const media = post.photo_url ? publicUrl('feed-photos', post.photo_url) : null
                return (
                  <div key={post.id} className="card" style={{ overflow: 'hidden' }}>
                    {post.body && <p style={{ padding: 14, font: '400 13.5px var(--font-ui)', color: 'var(--body)', margin: 0, lineHeight: 1.6 }}>{post.body}</p>}
                    {media && (
                      isVideo(media) ? (
                        <video src={media} controls playsInline style={{ width: '100%', maxHeight: 340, background: '#000', display: 'block' }} />
                      ) : isAudio(media) ? (
                        <div style={{ padding: '4px 14px 12px' }}><AudioPlayer src={media} /></div>
                      ) : (
                        <img src={media} alt="" style={{ width: '100%', height: 'auto', display: 'block', background: 'var(--field-bg)' }} />
                      )
                    )}
                    <div style={{ padding: '10px 14px', font: '400 11px var(--font-ui)', color: 'var(--muted)' }}>{timeAgo(post.created_at)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fiche coordonnées */}
      {coordsOpen && (
        <Sheet title="Coordonnées" onClose={() => setCoordsOpen(false)}>
          <div className="stack" style={{ gap: 10, paddingBottom: 4 }}>
            <CoordRow icon={<Phone size={19} weight="fill" color="var(--cyan-dark)" />} label="Téléphone"
              value={p.phone} href={p.phone ? `tel:${p.phone}` : null} />
            <CoordRow icon={<EnvelopeSimple size={19} weight="fill" color="var(--cyan-dark)" />} label="Email"
              value={realEmail} href={realEmail ? `mailto:${realEmail}` : null} />
            <CoordRow icon={<MusicNote size={19} weight="fill" color="var(--cyan-dark)" />} label="Pupitre"
              value={pupitreLabel(p.pupitre)} />
          </div>
        </Sheet>
      )}
    </Screen>
  )
}

function CoordRow({ icon, label, value, href }) {
  const inner = (
    <div className="row" style={{ gap: 12, padding: 14, background: 'var(--field-bg)', borderRadius: 14 }}>
      <span className="center" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--card-bg)', flexShrink: 0 }}>{icon}</span>
      <div className="stack grow" style={{ minWidth: 0 }}>
        <span style={{ font: '600 10.5px var(--font-ui)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5 }}>{label}</span>
        <span style={{ font: '600 14px var(--font-ui)', color: 'var(--title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || 'Non renseigné'}
        </span>
      </div>
    </div>
  )
  return href ? <a href={href} className="tap" style={{ display: 'block' }}>{inner}</a> : inner
}
