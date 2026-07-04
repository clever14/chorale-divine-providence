import { useState } from 'react'
import { CaretDown, Users, Key, Copy } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, ChipSelect, Loader, EmptyState, Sheet, Button } from '../../components/ui'
import { useToast, useConfirm } from '../../context/ToastContext'
import { PUPITRES, pupitreLabel } from '../../data/enums'

export default function Members() {
  const { show } = useToast()
  const confirmAsk = useConfirm()
  const [openId, setOpenId] = useState(null)
  const [resetInfo, setResetInfo] = useState(null) // { name, tempPassword }

  const { data, loading, reload } = useAsync(async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email, contact_email, phone, pupitre, avatar_initials, photo_url, status').eq('status', 'active').order('full_name')
    return data || []
  }, [])

  const changePupitre = async (id, pupitre) => {
    const { error } = await supabase.from('profiles').update({ pupitre }).eq('id', id)
    if (error) show(error.message, 'error')
    else { show('Pupitre mis à jour', 'success'); reload() }
  }

  const resetPassword = async (m) => {
    const ok = await confirmAsk(`Réinitialiser le mot de passe de ${m.full_name} ? Un mot de passe temporaire sera généré ; le choriste devra le changer à sa prochaine connexion.`, { confirmLabel: 'Réinitialiser' })
    if (!ok) return
    // Mot de passe temporaire lisible
    const temp = 'CDP' + Math.floor(1000 + Math.random() * 9000)
    const { data: sess } = await supabase.auth.getSession()
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { target_user_id: m.id, temp_password: temp },
        headers: { Authorization: `Bearer ${sess?.session?.access_token}` }
      })
      if (error || data?.error) throw new Error(data?.error || error.message)
      setResetInfo({ name: m.full_name, tempPassword: temp })
    } catch (e) {
      show("Réinitialisation impossible. Vérifiez que l'Edge Function est déployée.", 'error')
    }
  }

  return (
    <Screen>
      <BackHeader title="Membres" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        {loading ? <Loader /> : !data.length ? (
          <EmptyState icon={<Users size={42} weight="light" />} title="Aucun membre actif" />
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {data.map((m) => {
              const open = openId === m.id
              return (
                <div key={m.id} className="card" style={{ overflow: 'hidden' }}>
                  <button className="tap row" onClick={() => setOpenId(open ? null : m.id)} style={{ padding: 14, gap: 12, width: '100%', textAlign: 'left' }}>
                    <Avatar name={m.full_name} initials={m.avatar_initials} url={m.photo_url} size={44} bg="var(--pink-bg)" color="var(--pink)" />
                    <div className="stack grow">
                      <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{m.full_name}</span>
                      <span style={{ font: '400 11.5px var(--font-ui)', color: 'var(--muted)' }}>{pupitreLabel(m.pupitre)}{m.phone ? ` · ${m.phone}` : ''}</span>
                    </div>
                    <CaretDown size={18} color="var(--muted)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                  </button>
                  {open && (
                    <div style={{ padding: '0 14px 14px' }}>
                      <span className="label" style={{ display: 'block', marginBottom: 8 }}>Changer de pupitre</span>
                      <ChipSelect options={PUPITRES} value={m.pupitre} onChange={(v) => changePupitre(m.id, v)} />

                      <button className="tap row" onClick={() => resetPassword(m)} style={{ marginTop: 14, width: '100%', padding: '11px 14px', borderRadius: 12, background: 'var(--field-bg)', border: '1px solid var(--border)', gap: 10, color: 'var(--navy)', font: '700 12.5px var(--font-ui)' }}>
                        <Key size={18} weight="fill" /> Réinitialiser le mot de passe
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {resetInfo && (
        <Sheet title="Mot de passe réinitialisé" onClose={() => setResetInfo(null)}
          footer={<Button variant="primary" onClick={() => setResetInfo(null)}>Terminé</Button>}>
          <p style={{ font: '400 13px var(--font-ui)', color: 'var(--body-2)', lineHeight: 1.6, marginTop: 0 }}>
            Communiquez ce mot de passe temporaire à <strong>{resetInfo.name}</strong>. Il devra le changer à sa prochaine connexion.
          </p>
          <div className="row" style={{ gap: 10, background: 'var(--field-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 4 }}>
            <span className="grow" style={{ font: '700 20px var(--font-serif)', letterSpacing: 2, color: 'var(--navy)' }}>{resetInfo.tempPassword}</span>
            <button className="tap center" onClick={async () => { try { await navigator.clipboard.writeText(resetInfo.tempPassword); show('Copié', 'success') } catch { show('Copie impossible', 'error') } }} style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--navy)' }}>
              <Copy size={18} />
            </button>
          </div>
        </Sheet>
      )}
    </Screen>
  )
}
