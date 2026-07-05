import { useNavigate } from 'react-router-dom'
import { ShieldStar, UserCirclePlus, Megaphone, CalendarPlus, Trophy, MusicNotes, Users, ChartBar, Ticket, Scroll, IdentificationBadge, CaretRight, SignOut, UsersThree, MusicNotesSimple, CalendarCheck } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { StatusBar } from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'

const TILES = [
  { to: '/admin/announcements', icon: <Megaphone size={22} weight="fill" />, title: 'Annonces', sub: 'Publier & gérer' },
  { to: '/admin/event', icon: <CalendarPlus size={22} weight="fill" />, title: 'Événement', sub: "Ajouter à l'agenda" },
  { to: '/admin/chorist-of-month', icon: <Trophy size={22} weight="fill" />, title: 'Choriste du mois', sub: 'Désigner' },
  { to: '/admin/songs', icon: <MusicNotes size={22} weight="fill" />, title: 'Chants', sub: 'Gérer le répertoire' },
  { to: '/admin/members', icon: <Users size={22} weight="fill" />, title: 'Membres', sub: 'Pupitres & mots de passe' },
  { to: '/admin/stats', icon: <ChartBar size={22} weight="fill" />, title: 'Statistiques', sub: 'Présence' },
  { to: '/admin/invitations', icon: <Ticket size={22} weight="fill" />, title: 'Invitations', sub: "Codes d'accès" },
  { to: '/admin/reglement', icon: <Scroll size={22} weight="fill" />, title: 'Règlement', sub: 'Articles' },
  { to: '/admin/bureau', icon: <IdentificationBadge size={22} weight="fill" />, title: 'Bureau & aide', sub: 'Contacts' }
]

export default function AdminHome() {
  const nav = useNavigate()
  const { signOut } = useAuth()

  const { data } = useAsync(async () => {
    const now = new Date().toISOString()
    const [pending, members, songs, events] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('songs').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }).gte('starts_at', now)
    ])
    return {
      pending: pending.count || 0,
      members: members.count || 0,
      songs: songs.count || 0,
      events: events.count || 0
    }
  }, [])

  const pending = data?.pending || 0

  return (
    <div className="screen" style={{ background: 'var(--app-bg)' }}>
      {/* ===== Bandeau premium avec logo doré ===== */}
      <div style={{ background: 'var(--grad-banner-admin)', color: '#fff', paddingBottom: 26, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {/* halo décoratif */}
        <div style={{ position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,169,43,.22), rgba(224,169,43,0) 70%)' }} />
        <StatusBar />
        <div className="spread" style={{ padding: '4px 20px 0', position: 'relative' }}>
          <button className="tap" onClick={signOut} style={{ color: 'rgba(255,255,255,.85)', display: 'flex', gap: 6, alignItems: 'center', font: '600 12px var(--font-ui)' }}>
            <SignOut size={18} /> Quitter
          </button>
          <div className="row" style={{ gap: 7, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,210,94,.14)', border: '1px solid rgba(255,210,94,.3)', color: 'var(--gold-light)' }}>
            <ShieldStar size={15} weight="fill" />
            <span style={{ font: '700 11px var(--font-ui)', letterSpacing: 1 }}>ADMIN</span>
          </div>
        </div>

        <div className="center stack" style={{ gap: 8, padding: '10px 20px 0', position: 'relative' }}>
          <img src="/logo-gold-pad.png" alt="Chorale Divine Providence" style={{ width: 132, height: 'auto', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 6px 18px rgba(224,169,43,.3))' }} />
          <div style={{ font: '700 22px var(--font-serif)', textAlign: 'center' }}>Espace Administrateur</div>
          <div style={{ font: 'italic 400 12.5px var(--font-serif)', color: 'var(--cyan-soft)' }}>Gérez la vie de la chorale</div>
        </div>
      </div>

      <div className="screen-scroll pad" style={{ paddingTop: 18, paddingBottom: 30 }}>
        {/* ===== Mini-statistiques ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          <MiniStat icon={<UsersThree size={18} weight="fill" />} value={data?.members ?? '—'} label="Membres" />
          <MiniStat icon={<MusicNotesSimple size={18} weight="fill" />} value={data?.songs ?? '—'} label="Chants" />
          <MiniStat icon={<CalendarCheck size={18} weight="fill" />} value={data?.events ?? '—'} label="À venir" />
        </div>

        {/* ===== Demandes d'inscription (toujours accessible) ===== */}
        <button
          className="tap row"
          onClick={() => nav('/admin/accounts')}
          style={{
            width: '100%', borderRadius: 16, padding: 15, gap: 14, marginBottom: 22, textAlign: 'left',
            background: pending > 0 ? 'var(--grad-btn-gold)' : 'var(--card-bg)',
            color: pending > 0 ? '#3a2c00' : 'var(--title)',
            border: pending > 0 ? 'none' : '1px solid var(--border-2)',
            boxShadow: pending > 0 ? '0 10px 26px rgba(224,169,43,.32)' : 'var(--sh-card)'
          }}
        >
          <div className="center" style={{ width: 44, height: 44, borderRadius: 13, background: pending > 0 ? 'rgba(255,255,255,.28)' : 'rgba(3,159,200,.1)', color: pending > 0 ? '#3a2c00' : 'var(--cyan-dark)', position: 'relative' }}>
            <UserCirclePlus size={24} weight="fill" />
            {pending > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, padding: '0 5px', borderRadius: 10, background: 'var(--red)', color: '#fff', font: '700 11px var(--font-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>{pending}</span>
            )}
          </div>
          <div className="stack grow">
            <span style={{ font: '700 15px var(--font-ui)' }}>Demandes d'inscription</span>
            <span style={{ font: '500 12px var(--font-ui)', opacity: .85 }}>
              {pending > 0 ? `${pending} demande(s) à valider` : 'Consulter et gérer les demandes'}
            </span>
          </div>
          <CaretRight size={18} weight="bold" />
        </button>

        {/* ===== Grille de gestion ===== */}
        <span className="label" style={{ display: 'block', marginBottom: 12 }}>Gestion</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {TILES.map((t) => (
            <button key={t.to} className="card tap" onClick={() => nav(t.to)} style={{ padding: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, transition: 'transform .12s ease' }}>
              <div className="center" style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg, rgba(3,159,200,.14), rgba(4,31,96,.08))', color: 'var(--cyan-dark)' }}>{t.icon}</div>
              <div className="stack">
                <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)' }}>{t.title}</span>
                <span style={{ font: '400 11.5px var(--font-ui)', color: 'var(--muted)' }}>{t.sub}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ icon, value, label }) {
  return (
    <div className="card center stack" style={{ padding: '14px 8px', gap: 5 }}>
      <div className="center" style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(224,169,43,.14)', color: 'var(--gold-dark)' }}>{icon}</div>
      <span style={{ font: '700 19px var(--font-serif)', color: 'var(--navy)' }}>{value}</span>
      <span style={{ font: '600 9.5px var(--font-ui)', letterSpacing: .5, color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}
