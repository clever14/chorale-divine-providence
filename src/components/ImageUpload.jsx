import { useRef, useState } from 'react'
import { ImageSquare, FilePdf } from '@phosphor-icons/react'
import { checkFileSize } from '../lib/config'

/**
 * Emplacement de téléversement (drag & drop + clic).
 * onFile(file) est appelé avec le fichier choisi ; `preview` (URL) l'affiche.
 * variant : 'photo' (ratio large) | 'score' (partition, contain).
 * onError(message) : callback si le fichier dépasse la limite.
 * limitKind : 'photo' | 'pdf' | 'video' pour le contrôle de taille.
 */
export default function ImageUpload({ onFile, onError, preview, accept = 'image/*', variant = 'photo', height = 200, label, limitKind }) {
  const input = useRef(null)
  const [drag, setDrag] = useState(false)
  const [local, setLocal] = useState(null)

  const handle = (file) => {
    if (!file) return
    // Détermine le type de limite : explicite, sinon d'après le fichier.
    const kind = limitKind || (file.type.startsWith('video') ? 'video' : file.type === 'application/pdf' ? 'pdf' : 'photo')
    const err = checkFileSize(file, kind)
    if (err) { onError?.(err); return }
    setLocal(URL.createObjectURL(file))
    onFile?.(file)
  }
  const shown = preview || local
  const isPdf = shown && (accept.includes('pdf')) && /\.pdf($|\?)/i.test(shown)

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => handle(e.target.files?.[0])}
      />
      <div
        className="tap"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]) }}
        style={{
          height, borderRadius: 15, overflow: 'hidden',
          border: `1.5px dashed ${drag ? 'var(--cyan)' : 'var(--border)'}`,
          background: drag ? 'rgba(3,159,200,.06)' : 'var(--field-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
        }}
      >
        {shown && !isPdf ? (
          <img
            src={shown}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: variant === 'score' ? 'contain' : 'cover' }}
          />
        ) : (
          <div className="center stack" style={{ gap: 8, color: 'var(--muted)' }}>
            {isPdf
              ? <FilePdf size={34} weight="light" color="var(--red)" />
              : <ImageSquare size={34} weight="light" />}
            <span style={{ font: '500 12px var(--font-ui)' }}>
              {label || (isPdf ? 'PDF importé' : 'Toucher ou déposer une image')}
            </span>
          </div>
        )}
      </div>
    </>
  )
}
