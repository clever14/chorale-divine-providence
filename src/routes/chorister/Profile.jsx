import { useNavigate } from 'react-router-dom'
import { EnvelopeSimple, Phone, MusicNotes, CalendarCheck, Star, Moon, Bell, Lock, Question, Scroll, Info, SignOut, CaretRight } from '@phosphor-icons/react'
import { useAuth, useTheme } from '../../context/AuthContext'
import { TabHeader } from '../../components/Layout'
import { Avatar } from '../../components/ui'
import { pupitreLabel } from '../../data/enums'

export default function Profile() {
  const nav = useNavigate()
  const { profile, signOut } = useAuth()
  const [dark, setDark] = useTheme()

  return (
    <>
      <TabHeader title="Profil" />

      {/* Bandeau bleu */}
      <div className="pad">
        <div style={{ background: 'var(--grad-banner)', borderRadius: 20, padding: 20, color: '#fff', display: 'flex', gap: 16, alignItems: 'center' }}>
          <Avatar name={profile?.full_name} initials={profile?.avatar_initials} url={profile?.photo_url} size={64} bg="rgba(255,255,255,.15)" color="#fff" />
          <div className="stack grow">
            <span style={{ font: '700 18px var(--font-serif)' }}>{profile?.full_name}</span>
            <span style={{ font: '400 12px var(--font-ui)', color: 'var(--cyan-light)' }}>{pupitreLabel(profile?.pupitre)}</span>
            <span style={{ font: '600 10px var(--font-ui)', letterSpacing: 1, color: 'rgba(255,255,255,.7)', marginTop: 4, textTransform: 'uppercase' }}>● Membre actif</span>
          </div>
        </div>
      </div>

      <div className="pad" style={{ paddingTop: 18, paddingBottom: 30 }}>
        <span className="label" style={{ display: 'block', marginBottom: 10 }}>Coordonnées</span>
        <div className="card stack" style={{ padding: '4px 0', marginBottom: 20 }}>
          <InfoRow icon={<Phone size={20} />} label="Téléphone" value={profile?.phone || '—'} />
          <InfoRow icon={<EnvelopeSimple size={20} />} label="Email" value={profile?.contact_email || '—'} />
          <InfoRow icon={<MusicNotes size={20} />} label="Pupitre" value={pupitreLabel(profile?.pupitre)} last />
        </div>

        <div className="card stack" style={{ padding: '4px 0', marginBottom: 20 }}>
          <MenuRow icon={<CalendarCheck size={20} />} label="Mes présences" onClick={() => nav('/presence')} />
          <MenuRow icon={<Star size={20} />} label="Mes chants favoris" onClick={() => nav('/songs')} last />
        </div>

        <div className="card stack" style={{ padding: '4px 0', marginBottom: 20 }}>
          <ToggleRow icon={<Moon size={20} />} label="Mode sombre" checked={dark} onChange={setDark} />
          <MenuRow icon={<Bell size={20} />} label="Notifications" onClick={() => nav('/notifications')} />
          <MenuRow icon={<Lock size={20} />} label="Confidentialité" last />
        </div>

        <div className="card stack" style={{ padding: '4px 0', marginBottom: 20 }}>
          <MenuRow icon={<Question size={20} />} label="Aide & contact" onClick={() => nav('/help')} />
          <MenuRow icon={<Scroll size={20} />} label="Règlement de la chorale" onClick={() => nav('/reglement')} />
          <MenuRow icon={<Info size={20} />} label="À propos" last />
        </div>

        <button className="tap row" onClick={signOut} style={{ padding: '14px 16px', width: '100%', color: 'var(--red)', font: '700 14px var(--font-ui)', gap: 12, justifyContent: 'center' }}>
          <SignOut size={20} weight="bold" /> Se déconnecter
        </button>
      </div>
    </>
  )
}

function InfoRow({ icon, label, value, last }) {
  return (
    <div className="row" style={{ padding: '13px 16px', gap: 14, borderBottom: last ? 'none' : '1px solid var(--border-3)' }}>
      <span style={{ color: 'var(--muted)', display: 'flex' }}>{icon}</span>
      <div className="stack grow">
        <span style={{ font: '600 10px var(--font-ui)', letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ font: '600 13.5px var(--font-ui)', color: 'var(--title)' }}>{value}</span>
      </div>
    </div>
  )
}

function MenuRow({ icon, label, onClick, last }) {
  return (
    <button className="tap row" onClick={onClick} style={{ padding: '14px 16px', gap: 14, borderBottom: last ? 'none' : '1px solid var(--border-3)', width: '100%', textAlign: 'left' }}>
      <span style={{ color: 'var(--cyan-dark)', display: 'flex' }}>{icon}</span>
      <span style={{ font: '600 13.5px var(--font-ui)', color: 'var(--title)' }} className="grow">{label}</span>
      <CaretRight size={16} color="var(--muted)" />
    </button>
  )
}

function ToggleRow({ icon, label, checked, onChange }) {
  return (
    <div className="row" style={{ padding: '14px 16px', gap: 14, borderBottom: '1px solid var(--border-3)' }}>
      <span style={{ color: 'var(--cyan-dark)', display: 'flex' }}>{icon}</span>
      <span style={{ font: '600 13.5px var(--font-ui)', color: 'var(--title)' }} className="grow">{label}</span>
      <button
        className="tap"
        onClick={() => onChange(!checked)}
        style={{
          width: 42, height: 24, borderRadius: 12,
          background: checked ? 'var(--cyan)' : 'var(--border)',
          position: 'relative', transition: 'background .2s'
        }}
        aria-pressed={checked}
      >
        <span style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
      </button>
    </div>
  )
}
