import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatCircle, MagnifyingGlass, Plus, Megaphone } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useUnread } from '../../context/UnreadContext'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, Loader, EmptyState, Sheet } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { messageTime } from '../../lib/format'
import { pupitreLabel } from '../../data/enums'

/** Avatar « Service Communication » (admin) — cohérent avec Le Fil. */
function OfficialAvatar({ size = 46 }) {
  return (
    <div className="center" style={{ width: size, height: size, borderRadius: '50%', background: 'var(--navy)', color: '#fff', flexShrink: 0 }}>
      <Megaphone size={Math.round(size * 0.48)} weight="fill" />
    </div>
  )
}

export default function Messages() {
  const nav = useNavigate()
  const { user } = useAuth()
  const { show } = useToast()
  const { byConv, refresh } = useUnread()
  const [q, setQ] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeQ, setComposeQ] = useState('')
  const [starting, setStarting] = useState(false)

  // Liste des conversations de l'utilisateur.
  const { data, loading, reload } = useAsync(async () => {
    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id)
    const ids = (memberships || []).map((m) => m.conversation_id)
    if (!ids.length) return []
    const [{ data: convs }, { data: allMembers }, { data: lastMsgs }] = await Promise.all([
      supabase.from('conversations').select('*').in('id', ids),
      supabase.from('conversation_members').select('conversation_id, user_id, profiles(full_name, avatar_initials, photo_url, role)').in('conversation_id', ids),
      supabase.from('messages').select('conversation_id, body, created_at').in('conversation_id', ids).order('created_at', { ascending: false })
    ])
    const lastByConv = new Map()
    ;(lastMsgs || []).forEach((m) => { if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m) })
    return (convs || []).map((c) => {
      const others = (allMembers || []).filter((m) => m.conversation_id === c.id && m.user_id !== user.id)
      const partner = others[0]?.profiles
      const isOfficial = partner?.role === 'admin'
      return {
        id: c.id,
        title: c.title || (isOfficial ? 'Service Communication' : partner?.full_name) || 'Conversation',
        initials: partner?.avatar_initials,
        photo: partner?.photo_url,
        isOfficial,
        last: lastByConv.get(c.id)
      }
    }).sort((a, b) => new Date(b.last?.created_at || 0) - new Date(a.last?.created_at || 0))
  }, [])

  // Membres joignables (pour le composeur « + »).
  const { data: members } = useAsync(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_initials, photo_url, role, pupitre')
      .eq('status', 'active')
      .neq('id', user.id)
      .order('full_name')
    return data || []
  }, [])

  // Temps réel : nouveau message -> on rafraîchit la liste et les compteurs.
  useEffect(() => {
    const channel = supabase
      .channel('messages:list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        reload()
        refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [reload, refresh])

  const startWith = async (memberId) => {
    setStarting(true)
    try {
      const { data: convId, error } = await supabase.rpc('get_or_create_direct_conversation', { p_other: memberId })
      if (error) throw error
      setComposeOpen(false)
      setComposeQ('')
      nav(`/messages/${convId}`)
    } catch (e) {
      show("Impossible d'ouvrir la conversation.", 'error')
    } finally {
      setStarting(false)
    }
  }

  const filtered = (data || []).filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()))
  const filteredMembers = (members || []).filter((m) => {
    const label = m.role === 'admin' ? 'Service Communication' : (m.full_name || '')
    return !composeQ || label.toLowerCase().includes(composeQ.toLowerCase())
  })

  const NewButton = (
    <button
      className="tap center"
      onClick={() => setComposeOpen(true)}
      aria-label="Nouveau message"
      style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--grad-btn-cyan)', color: '#fff', flexShrink: 0, boxShadow: '0 6px 16px rgba(3,159,200,.35)' }}
    >
      <Plus size={22} weight="bold" />
    </button>
  )

  return (
    <Screen>
      <BackHeader title="Messages" right={NewButton} />
      <div style={{ padding: '0 20px 12px' }}>
        <div className="field-icon">
          <span className="ic"><MagnifyingGlass size={19} /></span>
          <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un membre…" />
        </div>
      </div>

      <div className="pad" style={{ paddingBottom: 30 }}>
        {loading ? <Loader /> : !data.length ? (
          <EmptyState icon={<ChatCircle size={42} weight="light" />} title="Aucune conversation" text="Touchez « + » ou ouvrez le profil d'un membre pour démarrer une conversation." />
        ) : !filtered.length ? (
          <EmptyState icon={<MagnifyingGlass size={42} weight="light" />} title="Aucun résultat" text="Aucune conversation ne correspond à cette recherche." />
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {filtered.map((c) => {
              const unread = byConv[c.id] || 0
              const hasUnread = unread > 0
              return (
                <div key={c.id} className="card tap row" onClick={() => nav(`/messages/${c.id}`)} style={{ padding: 12, gap: 12 }}>
                  {c.isOfficial
                    ? <OfficialAvatar size={46} />
                    : <Avatar name={c.title} initials={c.initials} url={c.photo} size={46} bg="var(--pink-bg)" color="var(--pink)" />}
                  <div className="stack grow" style={{ minWidth: 0 }}>
                    <div className="spread" style={{ gap: 8 }}>
                      <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                      {c.last && <span style={{ font: `${hasUnread ? 700 : 400} 11px var(--font-ui)`, color: hasUnread ? 'var(--cyan-dark)' : 'var(--muted)', flexShrink: 0 }}>{messageTime(c.last.created_at)}</span>}
                    </div>
                    <div className="spread" style={{ gap: 8 }}>
                      <span style={{ font: `${hasUnread ? 600 : 400} 13px var(--font-ui)`, color: hasUnread ? 'var(--body)' : 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.last?.body || 'Aucun message'}
                      </span>
                      {hasUnread && (
                        <span className="center" style={{ minWidth: 20, height: 20, padding: '0 5px', borderRadius: 10, background: 'var(--red)', color: '#fff', font: '700 11px var(--font-ui)', flexShrink: 0 }}>
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Composeur : choisir un destinataire pour démarrer une conversation. */}
      {composeOpen && (
        <Sheet title="Nouveau message" onClose={() => { setComposeOpen(false); setComposeQ('') }}>
          <div className="field-icon" style={{ marginBottom: 14 }}>
            <span className="ic"><MagnifyingGlass size={19} /></span>
            <input className="field" value={composeQ} onChange={(e) => setComposeQ(e.target.value)} placeholder="Rechercher un membre…" autoFocus />
          </div>
          {!filteredMembers.length ? (
            <EmptyState title="Aucun membre" text="Aucun membre ne correspond à cette recherche." />
          ) : (
            <div className="stack" style={{ gap: 8, paddingBottom: 4 }}>
              {filteredMembers.map((m) => {
                const official = m.role === 'admin'
                const label = official ? 'Service Communication' : m.full_name
                const sub = official ? 'Administration de la chorale' : pupitreLabel(m.pupitre)
                return (
                  <button key={m.id} className="tap row" disabled={starting} onClick={() => startWith(m.id)}
                    style={{ width: '100%', textAlign: 'left', gap: 12, padding: '10px 12px', borderRadius: 14, background: 'var(--field-bg)' }}>
                    {official
                      ? <OfficialAvatar size={42} />
                      : <Avatar name={m.full_name} initials={m.avatar_initials} url={m.photo_url} size={42} bg="var(--pink-bg)" color="var(--pink)" />}
                    <div className="stack grow" style={{ minWidth: 0 }}>
                      <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{label}</span>
                      <span style={{ font: '400 11.5px var(--font-ui)', color: 'var(--muted)' }}>{sub}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </Sheet>
      )}
    </Screen>
  )
}
