import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, uploadFile, publicUrl } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button, Avatar, Loader, EmptyState } from '../../components/ui'
import ImageUpload from '../../components/ImageUpload'
import { useToast } from '../../context/ToastContext'
import { pupitreLabel } from '../../data/enums'

export default function ChoristOfMonthAdmin() {
  const nav = useNavigate()
  const { show } = useToast()
  const [selected, setSelected] = useState(null)
  const [motivation, setMotivation] = useState('')
  const [file, setFile] = useState(null)
  const [existingImage, setExistingImage] = useState(null)
  const [busy, setBusy] = useState(false)

  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data, loading } = useAsync(async () => {
    const [{ data: profiles }, { data: current }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, pupitre, avatar_initials, photo_url').eq('status', 'active').order('full_name'),
      supabase.from('chorist_of_month').select('*').eq('month', monthKey).maybeSingle()
    ])
    return { profiles: profiles || [], current: current || null }
  }, [])

  // Préremplir avec la désignation du mois en cours (si elle existe déjà),
  // afin que l'admin puisse la mettre à jour (ex. ajouter/remplacer l'affiche).
  useEffect(() => {
    if (data?.current) {
      setSelected(data.current.user_id)
      setMotivation(data.current.motivation || '')
      setExistingImage(data.current.image_url || null)
    }
  }, [data])

  const save = async () => {
    if (!selected) { show('Sélectionnez un choriste.', 'error'); return }
    setBusy(true)
    try {
      // Affiche : upload si une nouvelle image est choisie, sinon on garde l'existante.
      let image_url = existingImage
      if (file) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        image_url = await uploadFile('feed-photos', `chorist-of-month/${Date.now()}.${ext}`, file)
      }

      // Statistiques agrégées : présence % + événements présents.
      const { data: att } = await supabase.from('event_attendance').select('status').eq('user_id', selected)
      const total = att?.length || 0
      const present = att?.filter((a) => a.status === 'present').length || 0
      const stats = { presence_pct: total ? Math.round((present / total) * 100) : 0, events_attended: present }

      const { error } = await supabase.from('chorist_of_month').upsert(
        { month: monthKey, user_id: selected, motivation, stats, image_url },
        { onConflict: 'month' }
      )
      if (error) { show(error.message, 'error'); return }
      show('Choriste du mois désigné', 'success')
      nav(-1)
    } catch (e) {
      show(e.message || "Erreur lors de l'enregistrement.", 'error')
    } finally {
      setBusy(false)
    }
  }

  const list = data?.profiles || []
  // Aperçu : l'image existante tant qu'aucun nouveau fichier n'est choisi
  // (quand un fichier est choisi, ImageUpload gère son propre aperçu local).
  const preview = file ? null : (existingImage ? publicUrl('feed-photos', existingImage) : null)

  return (
    <Screen>
      <BackHeader title="Choriste du mois" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <span className="label" style={{ display: 'block', marginBottom: 10 }}>Affiche · format carré (post Instagram)</span>
        <div style={{ marginBottom: 20 }}>
          <ImageUpload
            onFile={setFile}
            onError={(m) => show(m, 'error')}
            preview={preview}
            accept="image/*"
            variant="photo"
            height={320}
            limitKind="photo"
            label="Toucher ou déposer l'affiche du choriste du mois"
          />
        </div>

        <Field label="Motivation" textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="Ex. Assiduité exemplaire et esprit d'équipe…" />

        <span className="label" style={{ display: 'block', marginBottom: 10 }}>Sélectionner un choriste</span>

        {loading ? <Loader /> : !list.length ? <EmptyState title="Aucun choriste actif" /> : (
          <div className="stack" style={{ gap: 8, marginBottom: 20 }}>
            {list.map((p) => (
              <button key={p.id} className="tap row" onClick={() => setSelected(p.id)} style={{
                padding: 12, gap: 12, borderRadius: 14, textAlign: 'left',
                background: selected === p.id ? 'rgba(3,159,200,.08)' : 'var(--card-bg)',
                border: `1px solid ${selected === p.id ? 'var(--cyan)' : 'var(--border-2)'}`
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${selected === p.id ? 'var(--cyan)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {selected === p.id && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--cyan)' }} />}
                </div>
                <Avatar name={p.full_name} initials={p.avatar_initials} url={p.photo_url} size={40} bg="var(--pink-bg)" color="var(--pink)" />
                <div className="stack grow">
                  <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{p.full_name}</span>
                  <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)' }}>{pupitreLabel(p.pupitre)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Désigner'}</Button>
      </div>
    </Screen>
  )
}
