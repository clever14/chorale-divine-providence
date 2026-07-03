import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, MusicNote, Star } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { TabHeader } from '../../components/Layout'
import { Loader, EmptyState } from '../../components/ui'
import { SONG_CATEGORIES, categoryLabel } from '../../data/enums'

export default function Songs() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [cat, setCat] = useState('tous')
  const [q, setQ] = useState('')

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: songs }, { data: favs }] = await Promise.all([
      supabase.from('songs').select('*').order('title'),
      supabase.from('song_favorites').select('song_id').eq('user_id', user.id)
    ])
    const favSet = new Set((favs || []).map((f) => f.song_id))
    return { songs: songs || [], favSet }
  }, [])

  const toggleFav = async (e, song) => {
    e.stopPropagation()
    const isFav = data.favSet.has(song.id)
    if (isFav) await supabase.from('song_favorites').delete().match({ user_id: user.id, song_id: song.id })
    else await supabase.from('song_favorites').insert({ user_id: user.id, song_id: song.id })
    reload()
  }

  const filtered = (data?.songs || []).filter((s) => {
    const okCat = cat === 'tous' || s.category === cat
    const okQ = !q || s.title.toLowerCase().includes(q.toLowerCase()) || (s.lyrics || '').toLowerCase().includes(q.toLowerCase())
    return okCat && okQ
  })

  const cats = [{ value: 'tous', label: 'Tous' }, ...SONG_CATEGORIES]

  return (
    <>
      <TabHeader title="Chants" />
      <div style={{ padding: '0 20px 12px' }}>
        <div className="field-icon">
          <span className="ic"><MagnifyingGlass size={19} /></span>
          <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un chant, parole…" />
        </div>
      </div>

      <div className="chip-scroll" style={{ padding: '0 20px 14px' }}>
        {cats.map((c) => (
          <button key={c.value} className={`chip tap${cat === c.value ? ' active' : ''}`} onClick={() => setCat(c.value)}>{c.label}</button>
        ))}
      </div>

      <div className="pad" style={{ paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? <Loader /> : !filtered.length ? (
          <EmptyState icon={<MusicNote size={42} weight="light" />} title="Aucun chant" text="Aucun chant ne correspond à ce filtre." />
        ) : filtered.map((s) => (
          <div key={s.id} className="card tap row" onClick={() => nav(`/songs/${s.id}`)} style={{ padding: 14, gap: 14 }}>
            <div className="center" style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--grad-btn)', flexShrink: 0 }}>
              <MusicNote size={22} color="#fff" weight="fill" />
            </div>
            <div className="stack grow">
              <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)', lineHeight: 1.3 }}>{s.title}</span>
              <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)' }}>
                {categoryLabel(s.category)}{s.subtitle ? ` · ${s.subtitle}` : ''}
              </span>
            </div>
            <button className="tap" onClick={(e) => toggleFav(e, s)} style={{ color: data.favSet.has(s.id) ? 'var(--gold)' : 'var(--border)', display: 'flex' }} aria-label="Favori">
              <Star size={22} weight={data.favSet.has(s.id) ? 'fill' : 'regular'} />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
