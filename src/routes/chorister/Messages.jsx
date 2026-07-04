import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatCircleDots, MagnifyingGlass } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, Loader, EmptyState } from '../../components/ui'
import { timeAgo } from '../../lib/format'

export default function Messages() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [q, setQ] = useState('')

  const { data, loading } = useAsync(async () => {
    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id)
    const ids = (memberships || []).map((m) => m.conversation_id)
    if (!ids.length) return []
    const [{ data: convs }, { data: allMembers }, { data: lastMsgs }] = await Promise.all([
      supabase.from('conversations').select('*').in('id', ids),
      supabase.from('conversation_members').select('conversation_id, user_id, profiles(full_name, avatar_initials, photo_url)').in('conversation_id', ids),
      supabase.from('messages').select('conversation_id, body, created_at').in('conversation_id', ids).order('created_at', { ascending: false })
    ])
    const lastByConv = new Map()
    ;(lastMsgs || []).forEach((m) => { if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m) })
    return (convs || []).map((c) => {
      const others = (allMembers || []).filter((m) => m.conversation_id === c.id && m.user_id !== user.id)
      const partner = others[0]?.profiles
      return {
        id: c.id,
        title: c.title || partner?.full_name || 'Conversation',
        initials: partner?.avatar_initials,
        photo: partner?.photo_url,
        last: lastByConv.get(c.id)
      }
    }).sort((a, b) => new Date(b.last?.created_at || 0) - new Date(a.last?.created_at || 0))
  }, [])

  const filtered = (data || []).filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()))

  return (
    <Screen>
      <BackHeader title="Messages" />
      <div style={{ padding: '0 20px 12px' }}>
        <div className="field-icon">
          <span className="ic"><MagnifyingGlass size={19} /></span>
          <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un membre…" />
        </div>
      </div>

      <div className="pad" style={{ paddingBottom: 30 }}>
        {loading ? <Loader /> : !data.length ? (
          <EmptyState icon={<ChatCircleDots size={42} weight="light" />} title="Aucune conversation" text="Ouvrez le profil d'un membre puis « Envoyer un message » pour démarrer une conversation." />
        ) : !filtered.length ? (
          <EmptyState icon={<MagnifyingGlass size={42} weight="light" />} title="Aucun résultat" text="Aucune conversation ne correspond à cette recherche." />
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {filtered.map((c) => (
              <div key={c.id} className="card tap row" onClick={() => nav(`/messages/${c.id}`)} style={{ padding: 12, gap: 12 }}>
                <Avatar name={c.title} initials={c.initials} url={c.photo} size={46} bg="var(--pink-bg)" color="var(--pink)" />
                <div className="stack grow" style={{ minWidth: 0 }}>
                  <div className="spread" style={{ gap: 8 }}>
                    <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)' }}>{c.title}</span>
                    {c.last && <span style={{ font: '400 11px var(--font-ui)', color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(c.last.created_at)}</span>}
                  </div>
                  <span style={{ font: '400 13px var(--font-ui)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.last?.body || 'Aucun message'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  )
}
