import { useRef, useState, useEffect } from 'react'
import { Play, Pause } from '@phosphor-icons/react'

export default function AudioPlayer({ src, onDark = false }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const a = ref.current
    if (!a) return
    const onTime = () => setProgress(a.duration ? a.currentTime / a.duration : 0)
    const onEnd = () => { setPlaying(false); setProgress(0) }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('ended', onEnd) }
  }, [src])

  const toggle = () => {
    const a = ref.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  const fg = onDark ? '#fff' : 'var(--navy)'
  const track = onDark ? 'rgba(255,255,255,.25)' : 'var(--border)'

  if (!src) {
    return (
      <div className="row" style={{ gap: 12, opacity: 0.6 }}>
        <div className="center" style={{ width: 46, height: 46, borderRadius: '50%', background: onDark ? 'rgba(255,255,255,.15)' : 'var(--field-bg)' }}>
          <Play size={20} weight="fill" color={fg} />
        </div>
        <span style={{ font: '500 12px var(--font-ui)', color: onDark ? 'rgba(255,255,255,.7)' : 'var(--muted)' }}>
          Aucun audio disponible
        </span>
      </div>
    )
  }

  return (
    <div className="row" style={{ gap: 12 }}>
      <audio ref={ref} src={src} preload="metadata" />
      <button
        className="tap center"
        onClick={toggle}
        style={{ width: 46, height: 46, borderRadius: '50%', background: onDark ? 'rgba(255,255,255,.18)' : 'var(--grad-btn-cyan)', boxShadow: onDark ? 'none' : 'var(--sh-btn-cyan)', flexShrink: 0 }}
        aria-label={playing ? 'Pause' : 'Lecture'}
      >
        {playing ? <Pause size={20} weight="fill" color="#fff" /> : <Play size={20} weight="fill" color="#fff" />}
      </button>
      <div className="grow" style={{ height: 5, borderRadius: 3, background: track, overflow: 'hidden' }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: onDark ? '#fff' : 'var(--cyan)', transition: 'width .15s linear' }} />
      </div>
    </div>
  )
}
