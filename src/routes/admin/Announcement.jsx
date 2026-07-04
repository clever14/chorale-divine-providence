import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone } from '@phosphor-icons/react'
import { supabase, uploadFile } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button, ChipSelect } from '../../components/ui'
import ImageUpload from '../../components/ImageUpload'
import { useToast } from '../../context/ToastContext'
import { PUPITRES } from '../../data/enums'

export default function Announcement() {
  const nav = useNavigate()
  const { user } = useAuth()
  const { show } = useToast()
  const [audience, setAudience] = useState('all')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)

  const publish = async () => {
    if (!title.trim() || !message.trim()) { show('Titre et message obligatoires.', 'error'); return }
    setBusy(true)
    try {
      let photo_url = null
      if (file) {
        const ext = file.name.split('.').pop()
        photo_url = await uploadFile('feed-photos', `announcements/${user.id}/${Date.now()}.${ext}`, file)
      }
      // Publication atomique : annonce + post "Annonce officielle" dans Le Fil + notification.
      const { error } = await supabase.rpc('admin_publish_announcement', {
        p_audience: audience,
        p_title: title.trim(),
        p_message: message.trim(),
        p_photo_url: photo_url
      })
      if (error) throw error
      show('Annonce publiée', 'success')
      nav(-1)
    } catch (e) {
      show(e.message || "Erreur lors de la publication.", 'error')
    } finally {
      setBusy(false)
    }
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
            L'annonce apparaîtra dans Le Fil comme « Annonce officielle » et notifiera les choristes.
          </p>
        </div>

        <div className="stack" style={{ gap: 10, marginBottom: 18 }}>
          <span className="label">Destinataires</span>
          <ChipSelect options={options} value={audience} onChange={setAudience} />
        </div>

        <Field label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Répétition annulée" />
        <Field label="Message" textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Détaillez ici…" />

        <div className="stack" style={{ gap: 10, marginBottom: 18 }}>
          <span className="label">Photo (facultatif)</span>
          <ImageUpload onFile={setFile} onError={(m) => show(m, 'error')} accept="image/*" variant="photo" height={160} label="Ajouter une photo à l'annonce" />
        </div>

        <Button variant="primary" onClick={publish} disabled={busy}>{busy ? 'Publication…' : "Publier l'annonce"}</Button>
      </div>
    </Screen>
  )
}
