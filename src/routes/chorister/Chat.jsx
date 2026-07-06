import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PaperPlaneTilt, Info } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useUnread } from '../../context/UnreadContext'
import { useAsync } from '../../hooks/useAsync'
import { BackHeader } from '../../components/Layout'
import { Loader } from '../../components/ui'
import { timeOnly } from '../../lib/format'

export default function Chat() {
  const { id } = useParams()
  const { user } = useAuth()
  const { markRead } = useUnread()
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const scrollRef = useRef(null)

  const { data, loading } = useAsync(async () => {
    const [{ data: conv }, { data: msgs }] = await Promise.all([
      supabase.from('conversations').select('*, conversation_members(user_id, profiles(full_name, avatar_initials, role))').eq('id', id).maybeSingle(),
      supabase.from('messages').select('*').eq('conversation_id', id).order('created_at')
    ])
    return { conv, initial: msgs || [] }
  }, [id])

  useEffect(() => {
    if (data?.initial) setMessages(data.initial)
  }, [data])

  // Marque la conversation comme lue à l'ouverture (retire le badge).
  useEffect(() => { markRead(id) }, [id, markRead])

  // Temps réel : nouveaux messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages((m) => [...m, payload.new])
          // Message reçu pendant que le fil est ouvert -> on le marque lu.
          if (payload.new?.sender_id !== user.id) markRead(id)
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, user.id, markRead])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const body = text.trim()
    if (!body) return
    setText('')
    await supabase.from('messages').insert({ conversation_id: id, sender_id: user.id, body })
  }

  const other = data?.conv?.conversation_members?.find((m) => m.user_id !== user.id)?.profiles
  const isOfficial = other?.role === 'admin'
  const title = data?.conv?.title || (isOfficial ? 'Service Communication' : other?.full_name) || 'Conversation'

  return (
    <div className="screen">
      <BackHeader title={title} />
      {loading ? <Loader /> : (
        <div ref={scrollRef} className="screen-scroll pad" style={{ paddingBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map((m) => {
            const mine = m.sender_id === user.id
            return (
              <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', gap: 3 }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 16,
                  borderTopRightRadius: mine ? 4 : 16, borderTopLeftRadius: mine ? 16 : 4,
                  background: mine ? 'var(--grad-btn-cyan)' : 'var(--card-bg)',
                  color: mine ? '#fff' : 'var(--body)',
                  border: mine ? 'none' : '1px solid var(--border-2)',
                  boxShadow: mine ? 'none' : 'var(--sh-card)',
                  font: '400 14px var(--font-ui)', lineHeight: 1.5, wordBreak: 'break-word'
                }}>{m.body}</div>
                <span style={{ font: '400 10px var(--font-ui)', color: 'var(--muted)' }}>{timeOnly(m.created_at)}</span>
              </div>
            )
          })}
        </div>
      )}

      {isOfficial ? (
        <div className="row" style={{ padding: '14px 16px calc(14px + var(--safe-bottom))', gap: 10, borderTop: '1px solid var(--border-2)', background: 'var(--card-bg)' }}>
          <Info size={18} weight="fill" color="var(--muted)" style={{ flexShrink: 0 }} />
          <span style={{ font: '400 12.5px var(--font-ui)', color: 'var(--muted)', lineHeight: 1.45 }}>
            Messages du Service Communication — la réponse n'est pas disponible.
          </span>
        </div>
      ) : (
        <div className="row" style={{ padding: '10px 14px calc(14px + var(--safe-bottom))', gap: 10, borderTop: '1px solid var(--border-2)', background: 'var(--card-bg)' }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Votre message…"
            className="field"
            style={{ borderRadius: 22, flex: 1, minWidth: 0, width: 'auto' }}
          />
          <button className="tap center" onClick={send} disabled={!text.trim()} style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--grad-btn-cyan)', flexShrink: 0 }} aria-label="Envoyer">
            <PaperPlaneTilt size={20} color="#fff" weight="fill" />
          </button>
        </div>
      )}
    </div>
  )
}
