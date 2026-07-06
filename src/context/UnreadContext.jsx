import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

/**
 * Suivi des messages non lus.
 *  - total    : nombre total de messages non lus (badge de l'en-tête)
 *  - byConv   : { [conversationId]: nombre } (badge par conversation)
 *  - markRead : marque une conversation comme lue (à l'ouverture d'un fil)
 *  - refresh  : recharge les compteurs depuis la base
 * Se met à jour en temps réel à l'arrivée d'un nouveau message.
 */
const UnreadContext = createContext({
  total: 0,
  byConv: {},
  markRead: async () => {},
  refresh: async () => {}
})

export const useUnread = () => useContext(UnreadContext)

export function UnreadProvider({ children }) {
  const { user, isActive } = useAuth()
  const [byConv, setByConv] = useState({})
  const userIdRef = useRef(user?.id)
  userIdRef.current = user?.id

  const refresh = useCallback(async () => {
    if (!user?.id || !isActive) { setByConv({}); return }
    const { data, error } = await supabase.rpc('unread_conversations')
    if (error) return
    const map = {}
    ;(data || []).forEach((r) => {
      const n = Number(r.unread) || 0
      if (n > 0) map[r.conversation_id] = n
    })
    setByConv(map)
  }, [user?.id, isActive])

  useEffect(() => { refresh() }, [refresh])

  // Temps réel : tout message reçu (hors les miens) incrémente le compteur.
  useEffect(() => {
    if (!user?.id || !isActive) return
    const channel = supabase
      .channel('unread:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new
          if (!msg || msg.sender_id === userIdRef.current) return
          setByConv((prev) => ({
            ...prev,
            [msg.conversation_id]: (prev[msg.conversation_id] || 0) + 1
          }))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, isActive])

  const markRead = useCallback(async (conversationId) => {
    if (!conversationId) return
    setByConv((prev) => {
      if (!prev[conversationId]) return prev
      const next = { ...prev }
      delete next[conversationId]
      return next
    })
    await supabase.rpc('mark_conversation_read', { p_conversation: conversationId })
  }, [])

  const total = Object.values(byConv).reduce((a, b) => a + b, 0)

  return (
    <UnreadContext.Provider value={{ total, byConv, markRead, refresh }}>
      {children}
    </UnreadContext.Provider>
  )
}
