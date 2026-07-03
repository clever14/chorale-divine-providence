import { NavLink } from 'react-router-dom'
import { House, MusicNotes, CalendarBlank, User } from '@phosphor-icons/react'

const TABS = [
  { to: '/app', label: 'Accueil', Icon: House, end: true },
  { to: '/songs', label: 'Chants', Icon: MusicNotes },
  { to: '/agenda', label: 'Agenda', Icon: CalendarBlank },
  { to: '/profile', label: 'Profil', Icon: User }
]

export default function TabBar() {
  return (
    <nav
      style={{
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 8px calc(10px + var(--safe-bottom))',
        background: 'var(--card-bg)',
        borderTop: '1px solid var(--border-2)',
        boxShadow: '0 -4px 20px rgba(4,31,96,.05)'
      }}
    >
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="tap"
          style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '4px 12px', color: isActive ? 'var(--navy)' : 'var(--muted)'
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
              <span style={{ font: '600 10px var(--font-ui)' }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
