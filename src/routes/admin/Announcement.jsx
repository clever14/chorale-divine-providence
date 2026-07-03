import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button, ChipSelect } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { PUPITRES } from '../../data/enums'

export default function Announcement() {
  const nav = useNavigate()
  const { show } = useToast()
  const [audience, setAudience] = useState('all')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const publish = async () => {
    if (!title.trim() || !message.trim()) { show('Titre et message obligatoires.', 'error'); return }
    setBusy(true)
    const { error } = await supabase.from('announcements').insert({ audience, title, message })
    if (!error) {
      await supabase.from('notifications').insert({ type: 'announcement', title, body: message })
    }
    setBusy(false)
    if (error) { show(error.message, 'error'); return }
    show('Annonce publiée', 'success')
    nav(-1)
  }

  const options = [
    { value: 'all', label: 'Toute la chorale' },
    ...PUPITRES.map((p) => ({ value: p.value, label: p.label }))
  ]

  return (
    <Screen>
      <BackHeader title="Nouvelle annonce" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <div className="row" style={{ gap: 12, padding: 14, background: 'rgba(3,159,200,.08)', borderRadius: 14, marginBottom: 20 }}>
          <Megaphone size={22} color="var(--cyan-dark)" weight="fill" />
          <p style={{ font: '400 12.5px var(--font-ui)', color: 'var(--body-2)', margin: 0, lineHeight: 1.5 }}>
            Les choristes recevront une notification dès la publication.
          </p>
        </div>

        <div className="stack" style={{ gap: 10, marginBottom: 18 }}>
          <span className="label">Destinataires</span>
          <ChipSelect options={options} value={audience} onChange={setAudience} />
        </div>

        <Field label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Répétition annulée" />
        <Field label="Message" textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Détaillez ici…" />

        <Button variant="primary" onClick={publish} disabled={busy}>{busy ? 'Publication…' : "Publier l'annonce"}</Button>
      </div>
    </Screen>
  )
}
