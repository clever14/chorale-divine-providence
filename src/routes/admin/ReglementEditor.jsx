import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TrashSimple } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button, Loader } from '../../components/ui'
import { useToast, useConfirm } from '../../context/ToastContext'

export default function ReglementEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const { show } = useToast()
  const confirmAsk = useConfirm()
  const isNew = !id || id === 'new'
  const [form, setForm] = useState({ num: 1, title: '', body: '' })
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isNew) {
      supabase.from('reglement_articles').select('num').order('num', { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
        setForm((f) => ({ ...f, num: (data?.num || 0) + 1 }))
      })
      return
    }
    supabase.from('reglement_articles').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) setForm({ num: data.num, title: data.title, body: data.body })
      setLoading(false)
    })
  }, [id, isNew])

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) { show('Titre et texte requis.', 'error'); return }
    setBusy(true)
    const payload = { num: Number(form.num), title: form.title, body: form.body }
    const { error } = isNew
      ? await supabase.from('reglement_articles').insert(payload)
      : await supabase.from('reglement_articles').update(payload).eq('id', id)
    setBusy(false)
    if (error) { show(error.message, 'error'); return }
    show('Article enregistré', 'success')
    nav('/admin/reglement')
  }

  const remove = async () => {
    if (!(await confirmAsk('Supprimer cet article ?', { danger: true, confirmLabel: 'Supprimer' }))) return
    const { error } = await supabase.from('reglement_articles').delete().eq('id', id)
    if (error) show(error.message, 'error')
    else { show('Article supprimé', 'success'); nav('/admin/reglement') }
  }

  if (loading) return <Screen><Loader /></Screen>

  return (
    <Screen>
      <BackHeader title={isNew ? 'Nouvel article' : 'Modifier l\'article'} right={
        !isNew && <button className="tap" onClick={remove} style={{ color: 'var(--red)', display: 'flex' }} aria-label="Supprimer"><TrashSimple size={22} /></button>
      } />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <Field label="Numéro" type="number" value={form.num} onChange={(e) => setForm({ ...form, num: e.target.value })} />
        <Field label="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex. Ponctualité aux répétitions" />
        <Field label="Texte" textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Rédigez le contenu de l'article…" />
        <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    </Screen>
  )
}
