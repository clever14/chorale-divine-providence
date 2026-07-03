import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button, ChipSelect } from '../../components/ui'
import { useToast } from '../../context/ToastContext'

const TYPES = [
  { value: 'Répétition', label: 'Répétition' },
  { value: 'Messe', label: 'Messe' },
  { value: 'Veillée', label: 'Veillée' },
  { value: 'Concert', label: 'Concert' },
  { value: 'Autre', label: 'Autre' }
]

export default function EventForm() {
  const nav = useNavigate()
  const { show } = useToast()
  const [form, setForm] = useState({ type: 'Répétition', title: '', date: '', time: '', location: '' })
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async () => {
    if (!form.title || !form.date || !form.time) { show('Titre, date et heure sont requis.', 'error'); return }
    setBusy(true)
    const starts_at = new Date(`${form.date}T${form.time}`).toISOString()
    const { error } = await supabase.from('events').insert({
      title: form.title, type: form.type, starts_at, location: form.location
    })
    if (!error) {
      await supabase.from('notifications').insert({
        type: 'event',
        title: `Nouvel événement : ${form.title}`,
        body: `${form.type} · ${new Date(starts_at).toLocaleString('fr-FR')}`
      })
    }
    setBusy(false)
    if (error) { show(error.message, 'error'); return }
    show('Événement ajouté', 'success')
    nav(-1)
  }

  return (
    <Screen>
      <BackHeader title="Nouvel événement" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <div className="stack" style={{ gap: 10, marginBottom: 18 }}>
          <span className="label">Type</span>
          <ChipSelect options={TYPES} value={form.type} onChange={(v) => setForm({ ...form, type: v })} />
        </div>

        <Field label="Titre" value={form.title} onChange={set('title')} placeholder="Ex. Répétition générale" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Date" type="date" value={form.date} onChange={set('date')} />
          <Field label="Heure" type="time" value={form.time} onChange={set('time')} />
        </div>

        <Field label="Lieu" value={form.location} onChange={set('location')} placeholder="Ex. Salle paroissiale" />

        <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : "Ajouter à l'agenda"}</Button>
      </div>
    </Screen>
  )
}
