import { ArrowsClockwise, ShareNetwork, Ticket, CheckCircle } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Loader, EmptyState } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { inviteUrl } from '../../lib/config'
import { timeAgo } from '../../lib/format'

export default function Invitations() {
  const { show } = useToast()

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: active }, { data: history }] = await Promise.all([
      supabase.from('invitation_codes').select('*').eq('used', false).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('invitation_codes').select('*, used_by_profile:profiles!invitation_codes_used_by_fkey(full_name)').eq('used', true).order('used_at', { ascending: false }).limit(20)
    ])
    return { active, history: history || [] }
  }, [])

  const regenerate = async () => {
    const { error } = await supabase.rpc('generate_invitation')
    if (error) show(error.message, 'error')
    else { show('Nouveau code généré', 'success'); reload() }
  }

  const share = async () => {
    if (!data?.active) return
    const link = inviteUrl(data.active.code)
    const text =
      `Rejoignez la Chorale Divine Providence 🎶\n\n` +
      `Votre code d'invitation : ${data.active.code} (valable 7 jours, usage unique).\n\n` +
      `Inscrivez-vous directement ici : ${link}`
    try {
      if (navigator.share) await navigator.share({ text, title: 'Chorale Divine Providence' })
      else { await navigator.clipboard.writeText(text); show('Message copié dans le presse-papier', 'success') }
    } catch { /* utilisateur a annulé */ }
  }

  return (
    <Screen>
      <BackHeader title="Codes d'invitation" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <p style={{ font: '400 13px var(--font-ui)', color: 'var(--body-2)', lineHeight: 1.6, marginBottom: 16 }}>
          Générez un code pour inviter un nouveau choriste. Il le saisit à l'inscription : son compte est alors rattaché à la chorale et validé automatiquement.
        </p>

        {loading ? <Loader /> : (
          <>
            {data.active ? (
              <div style={{ background: 'var(--grad-banner)', borderRadius: 20, padding: 24, color: '#fff', textAlign: 'center', marginBottom: 14 }}>
                <div style={{ font: '700 11px var(--font-ui)', letterSpacing: 1.4, color: 'var(--cyan-light)', textTransform: 'uppercase', marginBottom: 8 }}>Code d'invitation actif</div>
                <div style={{ font: '700 32px var(--font-serif)', letterSpacing: 3, margin: '4px 0 6px' }}>{data.active.code}</div>
                <div style={{ font: '400 12px var(--font-ui)', color: 'rgba(255,255,255,.75)' }}>Valable 7 jours · usage unique</div>
              </div>
            ) : (
              <div className="card center stack" style={{ padding: 24, gap: 10, marginBottom: 14, textAlign: 'center' }}>
                <Ticket size={36} color="var(--muted)" weight="light" />
                <span style={{ font: '600 13px var(--font-ui)', color: 'var(--muted)' }}>Aucun code actif</span>
              </div>
            )}

            <div className="row" style={{ gap: 10, marginBottom: 22 }}>
              <button className="tap grow row center" onClick={regenerate} style={{ background: 'var(--grad-btn)', color: '#fff', padding: '13px 16px', borderRadius: 14, gap: 8, font: '700 13px var(--font-ui)', boxShadow: 'var(--sh-btn)' }}>
                <ArrowsClockwise size={18} weight="bold" /> Régénérer
              </button>
              <button className="tap grow row center" onClick={share} disabled={!data.active} style={{ background: 'var(--grad-btn-cyan)', color: '#fff', padding: '13px 16px', borderRadius: 14, gap: 8, font: '700 13px var(--font-ui)', boxShadow: 'var(--sh-btn-cyan)', opacity: data.active ? 1 : .5 }}>
                <ShareNetwork size={18} weight="bold" /> Partager
              </button>
            </div>

            <span className="label" style={{ display: 'block', marginBottom: 10 }}>Codes récemment utilisés</span>
            {!data.history.length ? <EmptyState title="Aucun code utilisé" /> : (
              <div className="stack" style={{ gap: 10 }}>
                {data.history.map((h) => (
                  <div key={h.id} className="card row" style={{ padding: 12, gap: 12 }}>
                    <div className="center" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--green-bg)', flexShrink: 0 }}>
                      <CheckCircle size={20} color="var(--green)" weight="fill" />
                    </div>
                    <div className="stack grow">
                      <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{h.code}</span>
                      <span style={{ font: '400 11.5px var(--font-ui)', color: 'var(--muted)' }}>
                        Utilisé par {h.used_by_profile?.full_name || '—'} · {timeAgo(h.used_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Screen>
  )
}
