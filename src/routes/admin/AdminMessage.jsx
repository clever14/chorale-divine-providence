import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PaperPlaneTilt, MagnifyingGlass, Megaphone, Tray, CheckCircle } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, Segmented, ChipSelect, Field, Button, Loader, EmptyState } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { PUPITRES, pupitreLabel } from '../../data/enums'

export default function AdminMessage() {
  const nav = useNavigate()
  const { show } = useToast()
  const [mode, setMode] = useState('individual') // 'individual' | 'group'
  const [target, setTarget] = useState(null)      // id membre (individuel)
  const [audience, setAudience] = useState('all') // groupé
  const [q, setQ] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const { data: members, loading } = useAsync(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_initials, photo_url, pupitre')
      .eq('status', 'active')
      .eq('role', 'chorister')
      .order('full_name')
    return data || []
  }, [])

  const filtered = (members || []).filter((m) => !q || (m.full_name || '').toLowerCase().includes(q.toLowerCase()))
  const audienceOptions = [{ value: 'all', label: 'Toute la chorale' }, ...PUPITRES.map((p) => ({ value: p.value, label: p.label }))]

  const send = async () => {
    if (!body.trim()) { show('Le message est vide.', 'error'); return }
    if (mode === 'individual' && !target) { show('Choisissez un destinataire.', 'error'); return }
    setBusy(true)
    try {
      const { data: count, error } = await supabase.rpc('admin_send_message', {
        p_body: body.trim(),
        p_target: mode === 'individual' ? target : null,
        p_audience: mode === 'group' ? audience : null
      })
      if (error) throw error
      show(mode === 'individual' ? 'Message envoyé.' : `Message envoyé à ${count} membre(s).`, 'success')
      setBody('')
      setTarget(null)
    } catch (e) {
      show(e.message || "Échec de l'envoi.", 'error')
    } finally {
      setBusy(false)
    }
  }

  const inboxButton = (
    <button className="tap center" onClick={() => nav('/messages')} aria-label="Boîte de réception"
      style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--field-bg)', color: 'var(--navy)', flexShrink: 0 }}>
      <Tray size={20} weight="fill" />
    </button>
  )

  return (
    <Screen>
      <BackHeader title="Messagerie" right={inboxButton} />
      <div className="pad" style={{ paddingBottom: 30 }}>
        {/* Bandeau explicatif */}
        <div className="row" style={{ gap: 12, padding: 14, background: 'rgba(3,159,200,.08)', borderRadius: 14, marginBottom: 18 }}>
          <div className="center" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--navy)', color: '#fff', flexShrink: 0 }}>
            <Megaphone size={18} weight="fill" />
          </div>
          <p style={{ font: '400 12.5px var(--font-ui)', color: 'var(--body-2)', margin: 0, lineHeight: 1.5 }}>
            Vos messages arrivent aux choristes sous le nom <strong>« Service Communication »</strong>. Chacun le reçoit dans sa conversation privée.
          </p>
        </div>

        {/* Individuel / Groupé */}
        <div style={{ marginBottom: 18 }}>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'individual', label: 'Individuel' },
              { value: 'group', label: 'Groupé' }
            ]}
          />
        </div>

        {mode === 'individual' ? (
          <>
            <span className="label" style={{ display: 'block', marginBottom: 10 }}>Destinataire</span>
            <div className="field-icon" style={{ marginBottom: 12 }}>
              <span className="ic"><MagnifyingGlass size={19} /></span>
              <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un membre…" />
            </div>
            {loading ? <Loader /> : !filtered.length ? (
              <EmptyState title="Aucun membre" />
            ) : (
              <div className="stack" style={{ gap: 8, marginBottom: 18 }}>
                {filtered.map((m) => {
                  const on = target === m.id
                  return (
                    <button key={m.id} className="tap row" onClick={() => setTarget(on ? null : m.id)}
                      style={{ width: '100%', textAlign: 'left', gap: 12, padding: '10px 12px', borderRadius: 14, background: on ? 'rgba(3,159,200,.1)' : 'var(--field-bg)', border: on ? '1px solid var(--cyan)' : '1px solid transparent' }}>
                      <Avatar name={m.full_name} initials={m.avatar_initials} url={m.photo_url} size={42} bg="var(--pink-bg)" color="var(--pink)" />
                      <div className="stack grow" style={{ minWidth: 0 }}>
                        <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{m.full_name}</span>
                        <span style={{ font: '400 11.5px var(--font-ui)', color: 'var(--muted)' }}>{pupitreLabel(m.pupitre)}</span>
                      </div>
                      {on && <CheckCircle size={22} weight="fill" color="var(--cyan)" style={{ flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="stack" style={{ gap: 10, marginBottom: 18 }}>
            <span className="label">Destinataires</span>
            <ChipSelect options={audienceOptions} value={audience} onChange={setAudience} />
          </div>
        )}

        <Field label="Message" textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Écrivez votre message…" />

        <Button variant="primary" onClick={send} disabled={busy}>
          <PaperPlaneTilt size={18} weight="fill" /> {busy ? 'Envoi…' : 'Envoyer le message'}
        </Button>
      </div>
    </Screen>
  )
}
