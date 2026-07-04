import { NavLink, useNavigate } from 'react-router-dom'
import { House, Newspaper, MusicNotes, CalendarBlank, Plus } from '@phosphor-icons/react'

// Barre à 5 emplacements avec un bouton central "+" surélevé (maquette).
// Le "+" ouvre le compositeur du Fil. Le profil reste accessible via l'avatar
// en haut de l'écran d'accueil.
const LEFT = [
  { to: '/app', label: 'Accueil', Icon: House, end: true },
  { to: '/feed', label: 'Fil', Icon: Newspaper }
]
const RIGHT = [
  { to: '/songs', label: 'Chants', Icon: MusicNotes },
  { to: '/agenda', label: 'Agenda', Icon: CalendarBlank }
]

export default function TabBar() {
  const nav = useNavigate()

  return (
    <nav
      style={{
        flexShrink: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 76px 1fr 1fr',
        alignItems: 'center',
        padding: '8px 6px calc(8px + var(--safe-bottom))',
        background: 'var(--card-bg)',
        borderTop: '1px solid var(--border-2)',
        boxShadow: '0 -4px 20px rgba(4,31,96,.05)',
        position: 'relative'
      }}
    >
      {LEFT.map((t) => <Tab key={t.to} {...t} />)}

      {/* Bouton central "+" surélevé */}
      <div className="center" style={{ position: 'relative' }}>
        <button
          className="tap center"
          onClick={() => nav(`/feed?compose=${Date.now()}`)}
          aria-label="Partager une nouvelle"
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--grad-btn-cyan)', color: '#fff',
            boxShadow: '0 10px 24px rgba(3,159,200,.45)',
            marginTop: -26, border: '4px solid var(--card-bg)'
          }}
        >
          <Plus size={26} weight="bold" />
        </button>
      </div>

      {RIGHT.map((t) => <Tab key={t.to} {...t} />)}
    </nav>
  )
}

function Tab({ to, label, Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="tap"
      style={({ isActive }) => ({
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '4px 0', color: isActive ? 'var(--navy)' : 'var(--muted)'
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
          <span style={{ font: '600 10px var(--font-ui)' }}>{label}</span>
        </>
      )}
    </NavLink>
  )
}
