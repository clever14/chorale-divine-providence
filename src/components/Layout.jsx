import { useNavigate } from 'react-router-dom'
import { CaretLeft, Bell, ChatCircle } from '@phosphor-icons/react'
import { useUnread } from '../context/UnreadContext'

export function StatusBar() {
  // Plus de faux "9:41" : on ne garde qu'une réserve d'espace pour la safe-area iOS.
  return <div className="statusbar-spacer" />
}

/** Enveloppe d'écran : status bar + zone scrollable. */
export function Screen({ children, onDark = false, bg, style, noStatusBar = false }) {
  return (
    <div className="screen" style={{ background: bg, ...style }}>
      {!noStatusBar && <StatusBar />}
      <div className="screen-scroll">{children}</div>
    </div>
  )
}

/** En-tête avec flèche retour + titre (écrans empilés). */
export function BackHeader({ title, right, onDark = false, onBack }) {
  const nav = useNavigate()
  const color = onDark ? '#fff' : 'var(--title)'
  return (
    <div className="spread" style={{ padding: '4px 20px 14px' }}>
      <div className="row" style={{ gap: 12 }}>
        <button className="tap" onClick={() => (onBack ? onBack() : nav(-1))} style={{ color, display: 'flex' }} aria-label="Retour">
          <CaretLeft size={24} weight="bold" />
        </button>
        {title && <span className="screen-title" style={{ color }}>{title}</span>}
      </div>
      {right}
    </div>
  )
}

/** En-tête d'onglet principal : gros titre + messages/cloche.
    `titleStyle` (optionnel) permet d'ajuster la taille pour les titres longs. */
export function TabHeader({ title, greeting, name, avatar, titleStyle }) {
  const nav = useNavigate()
  const { total } = useUnread()
  return (
    <div className="spread" style={{ padding: '4px 20px 14px' }}>
      {greeting ? (
        <button className="tap row" onClick={() => nav('/profile')} style={{ gap: 12, textAlign: 'left' }} aria-label="Mon profil">
          {avatar}
          <div className="stack">
            <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)' }}>{greeting}</span>
            <span style={{ font: '700 18px var(--font-serif)', color: 'var(--title)' }}>{name}</span>
          </div>
        </button>
      ) : (
        <span className="big-title" style={titleStyle}>{title}</span>
      )}
      <div className="row" style={{ gap: 16, color: 'var(--navy)' }}>
        <button className="tap" onClick={() => nav('/messages')} style={{ position: 'relative', display: 'flex' }} aria-label="Messages">
          <ChatCircle size={24} />
          <CountBadge count={total} />
        </button>
        <button className="tap" onClick={() => nav('/notifications')} style={{ position: 'relative', display: 'flex' }} aria-label="Notifications">
          <Bell size={24} />
          <Dot />
        </button>
      </div>
    </div>
  )
}

/** Badge rouge chiffré (ex. messages non lus). Rien si le compteur est à 0. */
function CountBadge({ count }) {
  if (!count) return null
  return (
    <span style={{
      position: 'absolute', top: -6, right: -8, minWidth: 17, height: 17, padding: '0 4px',
      borderRadius: 9, background: 'var(--red)', color: '#fff',
      font: '700 10px var(--font-ui)', lineHeight: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '2px solid var(--app-bg)'
    }}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

function Dot() {
  return (
    <span style={{
      position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: '50%',
      background: 'var(--cyan)', border: '2px solid var(--app-bg)'
    }} />
  )
}
