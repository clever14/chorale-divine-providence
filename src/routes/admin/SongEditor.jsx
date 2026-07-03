import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MusicNote, TrashSimple } from '@phosphor-icons/react'
import { supabase, uploadFile, publicUrl } from '../../lib/supabase'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button, ChipSelect, Loader } from '../../components/ui'
import ImageUpload from '../../components/ImageUpload'
import { useToast, useConfirm } from '../../context/ToastContext'
import { SONG_CATEGORIES } from '../../data/enums'

export default function SongEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const { show } = useToast()
  const confirmAsk = useConfirm()
  const isNew = !id || id === 'new'

  const [form, setForm] = useState({ title: '', category: 'entree', subtitle: '', lyrics: '' })
  const [audioFile, setAudioFile] = useState(null)
  const [scoreFile, setScoreFile] = useState(null)
  const [existing, setExisting] = useState({ audio: null, score: null })
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isNew) return
    supabase.from('songs').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) {
        setForm({ title: data.title, category: data.category, subtitle: data.subtitle || '', lyrics: data.lyrics || '' })
        setExisting({
          audio: data.audio_url ? publicUrl('song-audio', data.audio_url) : null,
          score: data.score_url ? publicUrl('song-scores', data.score_url) : null,
          audio_path: data.audio_url,
          score_path: data.score_url
        })
      }
      setLoading(false)
    })
  }, [id, isNew])

  const save = async () => {
    if (!form.title.trim()) { show('Le titre est obligatoire.', 'error'); return }
    setBusy(true)
    try {
      let audio_url = existing.audio_path
      let score_url = existing.score_path

      if (audioFile) {
        const ext = audioFile.name.split('.').pop()
        audio_url = await uploadFile('song-audio', `${Date.now()}-${slugify(form.title)}.${ext}`, audioFile)
      }
      if (scoreFile) {
        const ext = scoreFile.name.split('.').pop()
        score_url = await uploadFile('song-scores', `${Date.now()}-${slugify(form.title)}.${ext}`, scoreFile)
      }

      const payload = { ...form, audio_url, score_url }
      if (isNew) {
        const { error } = await supabase.from('songs').insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase.from('songs').update(payload).eq('id', id)
        if (error) throw error
      }
      show('Chant enregistré', 'success')
      nav('/admin/songs')
    } catch (e) {
      show(e.message || 'Erreur', 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!(await confirmAsk('Supprimer ce chant ?', { danger: true, confirmLabel: 'Supprimer' }))) return
    const { error } = await supabase.from('songs').delete().eq('id', id)
    if (error) show(error.message, 'error')
    else { show('Chant supprimé', 'success'); nav('/admin/songs') }
  }

  if (loading) return <Screen><Loader /></Screen>

  return (
    <Screen>
      <BackHeader title={isNew ? 'Nouveau chant' : 'Modifier le chant'} right={
        !isNew && <button className="tap" onClick={remove} style={{ color: 'var(--red)', display: 'flex' }} aria-label="Supprimer"><TrashSimple size={22} /></button>
      } />

      <div className="pad" style={{ paddingBottom: 30 }}>
        <Field label="Titre du chant" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex. Peuple de Dieu marche joyeux" />

        <div className="stack" style={{ gap: 10, marginBottom: 18 }}>
          <span className="label">Moment liturgique</span>
          <ChipSelect options={SONG_CATEGORIES} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        </div>

        <Field label="Sous-titre" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Ex. Rassemblement" />

        <Field label="Paroles" textarea value={form.lyrics} onChange={(e) => setForm({ ...form, lyrics: e.target.value })} placeholder="Couplet 1&#10;Saisissez ici les paroles du chant, couplet par couplet…&#10;&#10;Refrain&#10;…" />

        <div className="stack" style={{ gap: 10, marginBottom: 18 }}>
          <div className="row" style={{ gap: 8, justifyContent: 'space-between' }}>
            <span className="label">Audio (MP3)</span>
            <span style={{ font: '600 10px var(--font-ui)', letterSpacing: 1, color: 'var(--cyan-dark)', textTransform: 'uppercase' }}>Recommandé</span>
          </div>
          <label className="tap row" style={{ padding: 14, borderRadius: 14, background: 'var(--field-bg)', border: '1.5px dashed var(--border)', gap: 12, cursor: 'pointer' }}>
            <div className="center" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--grad-btn-cyan)' }}>
              <MusicNote size={20} color="#fff" weight="fill" />
            </div>
            <div className="stack grow">
              <span style={{ font: '700 13px var(--font-ui)', color: 'var(--title)' }}>
                {audioFile ? audioFile.name : existing.audio ? 'Audio actuel — remplacer' : 'Importer un fichier MP3'}
              </span>
              <span style={{ font: '400 11.5px var(--font-ui)', color: 'var(--muted)' }}>MP3 · max 20 Mo</span>
            </div>
            <input type="file" accept="audio/*" hidden onChange={(e) => setAudioFile(e.target.files?.[0])} />
          </label>
        </div>

        <div className="stack" style={{ gap: 10, marginBottom: 22 }}>
          <span className="label">Partition (optionnelle)</span>
          <ImageUpload onFile={setScoreFile} preview={existing.score} accept="image/*,application/pdf" variant="score" height={180} label="Toucher pour ajouter une partition (image ou PDF)" />
        </div>

        <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    </Screen>
  )
}

function slugify(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 40) }
