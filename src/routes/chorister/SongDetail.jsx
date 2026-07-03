import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Star } from '@phosphor-icons/react'
import { supabase, publicUrl } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Loader, Segmented, EmptyState } from '../../components/ui'
import AudioPlayer from '../../components/AudioPlayer'
import { categoryLabel } from '../../data/enums'
import { ImageSquare } from '@phosphor-icons/react'

export default function SongDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [tab, setTab] = useState('lyrics')

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: song }, { data: fav }] = await Promise.all([
      supabase.from('songs').select('*').eq('id', id).maybeSingle(),
      supabase.from('song_favorites').select('song_id').eq('user_id', user.id).eq('song_id', id).maybeSingle()
    ])
    return { song, isFav: !!fav }
  }, [id])

  const toggleFav = async () => {
    if (!data?.song) return
    if (data.isFav) await supabase.from('song_favorites').delete().match({ user_id: user.id, song_id: id })
    else await supabase.from('song_favorites').insert({ user_id: user.id, song_id: id })
    reload()
  }

  if (loading || !data?.song) return <Screen>{loading ? <Loader /> : <EmptyState title="Chant introuvable" />}</Screen>
  const song = data.song
  const audio = publicUrl('song-audio', song.audio_url)
  const score = publicUrl('song-scores', song.score_url)

  return (
    <div className="screen" style={{ background: 'var(--app-bg)' }}>
      {/* Bandeau bleu marine */}
      <div style={{ background: 'var(--grad-banner)', color: '#fff', paddingBottom: 20, flexShrink: 0 }}>
        <BackHeader
          onDark
          right={
            <button className="tap" onClick={toggleFav} style={{ color: data.isFav ? 'var(--gold-light)' : 'rgba(255,255,255,.8)', display: 'flex' }} aria-label="Favori">
              <Star size={22} weight={data.isFav ? 'fill' : 'regular'} />
            </button>
          }
        />
        <div className="pad">
          <div style={{ font: '700 11px var(--font-ui)', letterSpacing: 1.4, color: 'var(--cyan-light)', textTransform: 'uppercase', marginBottom: 6 }}>
            {categoryLabel(song.category)}{song.subtitle ? ` · ${song.subtitle}` : ''}
          </div>
          <h1 style={{ font: '700 24px var(--font-serif)', margin: '0 0 18px' }}>{song.title}</h1>
          <div style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 14, padding: 12 }}>
            <AudioPlayer src={audio} onDark />
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px 12px', flexShrink: 0 }}>
        <Segmented
          options={[{ value: 'lyrics', label: 'Paroles' }, { value: 'score', label: 'Partition' }]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="screen-scroll pad" style={{ paddingBottom: 30 }}>
        {tab === 'lyrics' ? (
          song.lyrics ? (
            <pre className="serif" style={{ font: '400 15px var(--font-serif)', color: 'var(--body)', lineHeight: 1.9, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {song.lyrics}
            </pre>
          ) : (
            <EmptyState title="Paroles non renseignées" />
          )
        ) : score ? (
          <div style={{ background: '#fff', border: '1px solid var(--border-2)', borderRadius: 15, padding: 8 }}>
            {/\.pdf($|\?)/i.test(score) ? (
              <embed src={score} type="application/pdf" style={{ width: '100%', height: 460, borderRadius: 8 }} />
            ) : (
              <img src={score} alt="Partition" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
            )}
          </div>
        ) : (
          <EmptyState icon={<ImageSquare size={42} weight="light" />} title="Aucune partition" text="La partition n'est pas encore disponible." />
        )}
      </div>
    </div>
  )
}
