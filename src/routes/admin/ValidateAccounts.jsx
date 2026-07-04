import { useState } from 'react'
import { Check, X, UserCirclePlus, WhatsappLogo, Copy, ShareNetwork, ChatText } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, Loader, EmptyState, Sheet, Button } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { pupitreLabel } from '../../data/enums'
import { loginUrl, isSyntheticEmail } from '../../lib/config'

export default function ValidateAccounts() {
  const { show } = useToast()
  const [shareFor, setShareFor] = useState(null) // profil validé -> feuille de partage

  const { data, loading, reload } = useAsync(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('status', 'pending').order('created_at')
    return data || []
  }, [])

  const decide = async (p, decision) => {
    const status = decision === 'approve' ? 'active' : 'refused'
    const { error } = await supabase.from('profiles').update({ status }).eq('id', p.id)
    if (error) { show(error.message, 'error'); return }
    if (decision === 'approve') {
      await supabase.from('notifications').insert({ user_id: p.id, type: 'account', title: 'Compte validé', body: 'Bienvenue dans la chorale ! Vous pouvez maintenant vous connecter.' })
      setShareFor(p) // ouvre la feuille de partage du lien de connexion
    } else {
      show('Compte refusé', 'success')
    }
    reload()
  }

  return (
    <Screen>
      <BackHeader title="Demandes d'inscription" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        {loading ? <Loader /> : !data.length ? (
          <EmptyState icon={<UserCirclePlus size={42} weight="light" />} title="Aucune demande" text="Toutes les inscriptions ont été traitées." />
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            {data.map((p) => (
              <div key={p.id} className="card" style={{ padding: 14 }}>
                <div className="row" style={{ gap: 12, marginBottom: 12 }}>
                  <Avatar name={p.full_name} initials={p.avatar_initials} size={46} bg="var(--pink-bg)" color="var(--pink)" />
                  <div className="stack grow">
                    <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)' }}>{p.full_name || '—'}</span>
                    <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)' }}>{p.phone || '—'}</span>
                    {p.contact_email && <span style={{ font: '400 11.5px var(--font-ui)', color: 'var(--muted)' }}>{p.contact_email}</span>}
                    <span style={{ font: '600 11px var(--font-ui)', color: 'var(--cyan-dark)', marginTop: 2 }}>{pupitreLabel(p.pupitre)}</span>
                  </div>
                </div>
                <div className="row" style={{ gap: 10 }}>
                  <button className="tap grow row center" onClick={() => decide(p, 'refuse')} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--red-bg)', color: 'var(--red)', font: '700 13px var(--font-ui)', gap: 6 }}>
                    <X size={16} weight="bold" /> Refuser
                  </button>
                  <button className="tap grow row center" onClick={() => decide(p, 'approve')} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--grad-btn-cyan)', color: '#fff', font: '700 13px var(--font-ui)', gap: 6, boxShadow: 'var(--sh-btn-cyan)' }}>
                    <Check size={16} weight="bold" /> Valider
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {shareFor && <ShareSheet profile={shareFor} onClose={() => setShareFor(null)} notify={show} />}
    </Screen>
  )
}

/* ---- Feuille de partage du lien de connexion (point 4) ---- */
function ShareSheet({ profile, onClose, notify }) {
  const link = loginUrl()
  const identifiant = profile.phone || (isSyntheticEmail(profile.email) ? '' : profile.email)
  const message =
`Bonjour ${profile.full_name || ''} ! Votre demande d'inscription à la plateforme de la Chorale Divine Providence a été validée avec succès.

Vous pouvez désormais accéder à votre espace personnel en cliquant sur le lien ci-dessous :
${link}

Connectez-vous avec votre ${identifiant ? `identifiant (${identifiant})` : 'numéro de téléphone ou email'} et le mot de passe que vous avez renseignés lors de votre inscription.

Que Dieu vous bénisse.`

  const copy = async () => {
    try { await navigator.clipboard.writeText(message); notify('Message copié', 'success') }
    catch { notify('Copie impossible', 'error') }
  }
  const shareNative = async () => {
    try {
      if (navigator.share) await navigator.share({ text: message })
      else copy()
    } catch { /* annulé */ }
  }
  const wa = `https://wa.me/${(profile.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
  const sms = `sms:${profile.phone || ''}?body=${encodeURIComponent(message)}`
  const mail = profile.contact_email
    ? `mailto:${profile.contact_email}?subject=${encodeURIComponent('Votre compte Chorale est validé')}&body=${encodeURIComponent(message)}`
    : null

  return (
    <Sheet
      title="Compte validé ✓"
      onClose={onClose}
      footer={<Button variant="primary" onClick={onClose}>Terminé</Button>}
    >
      <p style={{ font: '400 13px var(--font-ui)', color: 'var(--body-2)', lineHeight: 1.6, marginTop: 0 }}>
        Partagez ce message avec <strong>{profile.full_name}</strong> pour l'inviter à se connecter :
      </p>

      <div style={{ background: 'var(--field-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, font: '400 12.5px var(--font-ui)', color: 'var(--body)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
        {message}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {profile.phone && (
          <a href={wa} target="_blank" rel="noreferrer" className="tap row center" style={{ background: 'var(--whatsapp)', color: '#fff', padding: '12px', borderRadius: 12, gap: 8, font: '700 13px var(--font-ui)' }}>
            <WhatsappLogo size={18} weight="fill" /> WhatsApp
          </a>
        )}
        {profile.phone && (
          <a href={sms} className="tap row center" style={{ background: 'var(--grad-btn-cyan)', color: '#fff', padding: '12px', borderRadius: 12, gap: 8, font: '700 13px var(--font-ui)' }}>
            <ChatText size={18} weight="fill" /> SMS
          </a>
        )}
        {mail && (
          <a href={mail} className="tap row center" style={{ background: 'var(--grad-btn)', color: '#fff', padding: '12px', borderRadius: 12, gap: 8, font: '700 13px var(--font-ui)' }}>
            <ShareNetwork size={18} weight="fill" /> Email
          </a>
        )}
        <button className="tap row center" onClick={copy} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--title)', padding: '12px', borderRadius: 12, gap: 8, font: '700 13px var(--font-ui)' }}>
          <Copy size={18} weight="bold" /> Copier
        </button>
        <button className="tap row center" onClick={shareNative} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--title)', padding: '12px', borderRadius: 12, gap: 8, font: '700 13px var(--font-ui)' }}>
          <ShareNetwork size={18} weight="bold" /> Autre…
        </button>
      </div>
    </Sheet>
  )
}
