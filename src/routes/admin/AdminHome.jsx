import { useNavigate } from 'react-router-dom'
import { ShieldStar, UserCirclePlus, Megaphone, CalendarPlus, Trophy, MusicNotes, Users, ChartBar, Ticket, Scroll, IdentificationBadge, CaretRight, SignOut } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { StatusBar, BackHeader } from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'

const TILES = [
  { to: '/admin/announcement', icon: <Megaphone size={22} weight="fill" />, title: 'Annonce', sub: 'Publier au fil' },
  { to: '/admin/event', icon: <CalendarPlus size={22} weight="fill" />, title: 'Événement', sub: "Ajouter à l'agenda" },
  { to: '/admin/chorist-of-month', icon: <Trophy size={22} weight="fill" />, title: 'Choriste du mois', sub: 'Désigner' },
  { to: '/admin/songs', icon: <MusicNotes size={22} weight="fill" />, title: 'Chants', sub: 'Gérer le répertoire' },
  { to: '/admin/members', icon: <Users size={22} weight="fill" />, title: 'Membres', sub: 'Pupitres & rôles' },
  { to: '/admin/stats', icon: <ChartBar size={22} weight="fill" />, title: 'Statistiques', sub: 'Présence' },
  { to: '/admin/invitations', icon: <Ticket size={22} weight="fill" />, title: 'Invitations', sub: "Codes d'accès" },
  { to: '/admin/reglement', icon: <Scroll size={22} weight="fill" />, title: 'Règlement', sub: 'Articles' },
  { to: '/admin/bureau', icon: <IdentificationBadge size={22} weight="fill" />, title: 'Bureau & aide', sub: 'Contacts' }
]

export default function AdminHome() {
  const nav = useNavigate()
  const { signOut } = useAuth()

  const { data } = useAsync(async () => {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    return count || 0
  }, [])

  return (
    <div className="screen" style={{ background: 'var(--app-bg)' }}>
      {/* Bandeau admin */}
      <div style={{ background: 'var(--grad-banner-admin)', color: '#fff', paddingBottom: 24, flexShrink: 0 }}>
        <StatusBar onDark />
        <BackHeader
          onDark
          onBack={() => signOut()}
          right={
            <div className="row" style={{ gap: 8, padding: '4px 12px', borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', color: 'var(--gold-light)' }}>
              <ShieldStar size={16} weight="fill" />
              <span style={{ font: '700 11px var(--font-ui)', letterSpacing: 1 }}>ADMIN</span>
            </div>
          }
        />
        <div className="pad">
          <div style={{ font: '700 26px var(--font-serif)' }}>Espace Admin</div>
          <div style={{ font: 'italic 400 13px var(--font-serif)', color: 'var(--cyan-soft)', marginTop: 4 }}>Gérez la vie de la chorale</div>
        </div>
      </div>

      <div className="screen-scroll pad" style={{ paddingTop: 16, paddingBottom: 30 }}>
        {data > 0 && (
          <button className="tap row" onClick={() => nav('/admin/accounts')} style={{ width: '100%', background: 'var(--grad-btn-gold)', color: '#fff', borderRadius: 15, padding: 14, gap: 14, marginBottom: 20, boxShadow: '0 10px 24px rgba(224,169,43,.35)' }}>
            <div className="center" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.2)' }}>
              <UserCirclePlus size={22} weight="fill" />
            </div>
            <div className="stack grow" style={{ textAlign: 'left' }}>
              <span style={{ font: '700 14px var(--font-ui)' }}>Comptes en attente</span>
              <span style={{ font: '500 12px var(--font-ui)', opacity: .9 }}>{data} demande(s) à valider</span>
            </div>
            <CaretRight size={18} weight="bold" />
          </button>
        )}

        <span className="label" style={{ display: 'block', marginBottom: 12 }}>Gestion</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {TILES.map((t) => (
            <button key={t.to} className="card tap" onClick={() => nav(t.to)} style={{ padding: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="center" style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(3,159,200,.1)', color: 'var(--cyan-dark)' }}>{t.icon}</div>
              <div className="stack">
                <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)' }}>{t.title}</span>
                <span style={{ font: '400 11.5px var(--font-ui)', color: 'var(--muted)' }}>{t.sub}</span>
              </div>
            </button>
          ))}
        </div>

        <button className="tap row" onClick={signOut} style={{ padding: '18px 16px', width: '100%', color: 'var(--red)', font: '700 14px var(--font-ui)', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          <SignOut size={20} weight="bold" /> Quitter l'espace admin
        </button>
      </div>
    </div>
  )
}
