import { useNavigate } from 'react-router-dom'
import { CaretLeft, Bell, EnvelopeSimple } from '@phosphor-icons/react'

export function StatusBar({ onDark = false }) {
  return (
    <div className={`statusbar${onDark ? ' on-dark' : ''}`}>
      <span>9:41</span>
      <span className="signal">
        <i className="ph-fill ph-cell-signal-full" />
        <i className="ph-fill ph-wifi-high" />
        <i className="ph-fill ph-battery-full" />
      </span>
    </div>
  )
}

/** Enveloppe d'écran : status bar + zone scrollable. */
export function Screen({ children, onDark = false, bg, style, noStatusBar = false }) {
  return (
    <div className="screen" style={{ background: bg, ...style }}>
      {!noStatusBar && <StatusBar onDark={onDark} />}
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

/** En-tête d'onglet principal : gros titre + cloche/messages. */
export function TabHeader({ title, greeting, name, avatar }) {
  const nav = useNavigate()
  return (
    <div className="spread" style={{ padding: '4px 20px 14px' }}>
      {greeting ? (
        <div className="row" style={{ gap: 12 }}>
          {avatar}
          <div className="stack">
            <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)' }}>{greeting}</span>
            <span style={{ font: '700 18px var(--font-serif)', color: 'var(--title)' }}>{name}</span>
          </div>
        </div>
      ) : (
        <span className="big-title">{title}</span>
      )}
      <div className="row" style={{ gap: 16, color: 'var(--navy)' }}>
        <button className="tap" onClick={() => nav('/messages')} style={{ position: 'relative', display: 'flex' }} aria-label="Messages">
          <EnvelopeSimple size={24} />
          <Dot />
        </button>
        <button className="tap" onClick={() => nav('/notifications')} style={{ position: 'relative', display: 'flex' }} aria-label="Notifications">
          <Bell size={24} />
          <Dot />
        </button>
      </div>
    </div>
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
