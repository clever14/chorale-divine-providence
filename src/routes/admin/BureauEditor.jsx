import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TrashSimple, Phone } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button, ChipSelect, Loader } from '../../components/ui'
import { useToast, useConfirm } from '../../context/ToastContext'
import { BUREAU_ROLES } from '../../data/enums'
import { initials } from '../../lib/format'

export default function BureauEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const { show } = useToast()
  const confirmAsk = useConfirm()
  const isNew = !id || id === 'new'
  const [form, setForm] = useState({ name: '', role: BUREAU_ROLES[0], phone: '', sort_order: 0 })
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isNew) return
    supabase.from('bureau_members').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) setForm({ name: data.name, role: data.role, phone: data.phone || '', sort_order: data.sort_order })
      setLoading(false)
    })
  }, [id, isNew])

  const save = async () => {
    if (!form.name.trim()) { show('Le nom est requis.', 'error'); return }
    setBusy(true)
    const payload = { ...form, avatar_initials: initials(form.name), sort_order: Number(form.sort_order) || 0 }
    const { error } = isNew
      ? await supabase.from('bureau_members').insert(payload)
      : await supabase.from('bureau_members').update(payload).eq('id', id)
    setBusy(false)
    if (error) { show(error.message, 'error'); return }
    show('Membre enregistré', 'success')
    nav('/admin/bureau')
  }

  const remove = async () => {
    if (!(await confirmAsk('Supprimer ce membre ?', { danger: true, confirmLabel: 'Supprimer' }))) return
    const { error } = await supabase.from('bureau_members').delete().eq('id', id)
    if (error) show(error.message, 'error')
    else { show('Membre supprimé', 'success'); nav('/admin/bureau') }
  }

  if (loading) return <Screen><Loader /></Screen>

  const roleOptions = BUREAU_ROLES.map((r) => ({ value: r, label: r }))

  return (
    <Screen>
      <BackHeader title={isNew ? 'Nouveau membre' : 'Modifier le membre'} right={
        !isNew && <button className="tap" onClick={remove} style={{ color: 'var(--red)', display: 'flex' }} aria-label="Supprimer"><TrashSimple size={22} /></button>
      } />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <Field label="Nom complet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Grégoire Aka" />

        <div className="stack" style={{ gap: 10, marginBottom: 18 }}>
          <span className="label">Fonction</span>
          <ChipSelect options={roleOptions} value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
        </div>

        <Field label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225 …" icon={<Phone size={19} />} />
        <Field label="Ordre d'affichage" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />

        <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    </Screen>
  )
}
