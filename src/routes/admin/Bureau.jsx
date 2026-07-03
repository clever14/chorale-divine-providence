import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, PencilSimple, IdentificationBadge, WhatsappLogo, EnvelopeSimple, FloppyDisk, TrashSimple } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, Field, Loader, EmptyState, Button, Sheet } from '../../components/ui'
import { useToast, useConfirm } from '../../context/ToastContext'

export default function Bureau() {
  const nav = useNavigate()
  const { show } = useToast()
  const confirmAsk = useConfirm()

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: bureau }, { data: help }, { data: faq }] = await Promise.all([
      supabase.from('bureau_members').select('*').order('sort_order'),
      supabase.from('help_links').select('*').eq('id', 1).maybeSingle(),
      supabase.from('faq').select('*').order('sort_order')
    ])
    return { bureau: bureau || [], help: help || { whatsapp_url: '', email_contact: '' }, faq: faq || [] }
  }, [])

  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [inited, setInited] = useState(false)
  if (data && !inited) {
    setWhatsapp(data.help.whatsapp_url || '')
    setEmail(data.help.email_contact || '')
    setInited(true)
  }

  const saveLinks = async () => {
    const { error } = await supabase.from('help_links').update({ whatsapp_url: whatsapp, email_contact: email }).eq('id', 1)
    if (error) show(error.message, 'error')
    else show('Liens d\'aide enregistrés', 'success')
  }

  const [faqOpen, setFaqOpen] = useState(false)
  const [faqDraft, setFaqDraft] = useState({ question: '', answer: '' })

  const saveFaq = async () => {
    if (!faqDraft.question.trim() || !faqDraft.answer.trim()) { show('Question et réponse requises.', 'error'); return }
    await supabase.from('faq').insert({
      question: faqDraft.question,
      answer: faqDraft.answer,
      sort_order: (data.faq.length || 0) + 1
    })
    setFaqOpen(false); setFaqDraft({ question: '', answer: '' })
    reload()
  }

  const deleteFaq = async (id) => {
    if (!(await confirmAsk('Supprimer cette question ?', { danger: true, confirmLabel: 'Supprimer' }))) return
    await supabase.from('faq').delete().eq('id', id)
    reload()
  }

  return (
    <Screen>
      <BackHeader title="Bureau & aide" right={
        <button className="tap" onClick={() => nav('/admin/bureau/new')} style={{ color: 'var(--cyan-dark)', display: 'flex' }} aria-label="Ajouter">
          <Plus size={26} weight="bold" />
        </button>
      } />

      <div className="pad" style={{ paddingBottom: 30 }}>
        <span className="label" style={{ display: 'block', marginBottom: 10 }}>Membres du bureau</span>

        {loading ? <Loader /> : !data.bureau.length ? (
          <EmptyState icon={<IdentificationBadge size={42} weight="light" />} title="Aucun membre" text="Ajoutez le premier avec le bouton +." />
        ) : (
          <div className="stack" style={{ gap: 10, marginBottom: 22 }}>
            {data.bureau.map((m) => (
              <div key={m.id} className="card row" style={{ padding: 12, gap: 12 }}>
                <Avatar name={m.name} initials={m.avatar_initials} size={44} bg="var(--pink-bg)" color="var(--pink)" />
                <div className="stack grow">
                  <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{m.name}</span>
                  <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)' }}>{m.role}{m.phone ? ` · ${m.phone}` : ''}</span>
                </div>
                <button className="tap center" onClick={() => nav(`/admin/bureau/${m.id}`)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--field-bg)', color: 'var(--navy)' }} aria-label="Modifier">
                  <PencilSimple size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <span className="label" style={{ display: 'block', marginBottom: 10 }}>Liens d'aide</span>
        <div className="card" style={{ padding: 14, marginBottom: 22 }}>
          <Field label="Lien WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https://wa.me/…" icon={<WhatsappLogo size={19} />} />
          <Field label="Email de contact" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@chorale.org" icon={<EnvelopeSimple size={19} />} />
          <Button variant="primary" onClick={saveLinks}><FloppyDisk size={18} weight="bold" /> Enregistrer</Button>
        </div>

        <div className="spread" style={{ marginBottom: 10 }}>
          <span className="label">FAQ</span>
          <button className="tap" onClick={() => setFaqOpen(true)} style={{ font: '700 12px var(--font-ui)', color: 'var(--cyan-dark)' }}>+ Ajouter</button>
        </div>
        {!data?.faq?.length ? <EmptyState title="Aucune question" /> : (
          <div className="stack" style={{ gap: 10 }}>
            {data.faq.map((f) => (
              <div key={f.id} className="card row" style={{ padding: 12, gap: 12 }}>
                <div className="stack grow">
                  <span style={{ font: '700 13px var(--font-ui)', color: 'var(--title)' }}>{f.question}</span>
                  <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)' }}>{f.answer}</span>
                </div>
                <button className="tap center" onClick={() => deleteFaq(f.id)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--red-bg)', color: 'var(--red)' }} aria-label="Supprimer">
                  <TrashSimple size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {faqOpen && (
        <Sheet
          title="Nouvelle question"
          onClose={() => setFaqOpen(false)}
          footer={<Button variant="primary" onClick={saveFaq}>Ajouter</Button>}
        >
          <Field
            label="Question"
            value={faqDraft.question}
            onChange={(e) => setFaqDraft({ ...faqDraft, question: e.target.value })}
            placeholder="Ex. Comment rejoindre la chorale ?"
          />
          <Field
            label="Réponse"
            textarea
            value={faqDraft.answer}
            onChange={(e) => setFaqDraft({ ...faqDraft, answer: e.target.value })}
            placeholder="Rédigez la réponse…"
          />
        </Sheet>
      )}
    </Screen>
  )
}
