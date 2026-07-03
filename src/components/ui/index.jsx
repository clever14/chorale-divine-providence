import { useState } from 'react'
import { X, CaretDown } from '@phosphor-icons/react'
import { initials } from '../../lib/format'

/* ---------- Avatar ---------- */
export function Avatar({ name, initials: ini, size = 44, url, bg = 'var(--cyan-soft)', color = 'var(--navy)' }) {
  const text = ini || initials(name)
  if (url) {
    return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      font: `700 ${Math.round(size * 0.36)}px var(--font-ui)`, flexShrink: 0
    }}>
      {text}
    </div>
  )
}

/* ---------- Bottom sheet (compose overlay) ---------- */
export function Sheet({ title, onClose, children, footer }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(4,12,32,.45)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'fadeIn .2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)', borderRadius: '22px 22px 0 0', padding: '10px 20px calc(20px + var(--safe-bottom))',
          maxHeight: '88%', display: 'flex', flexDirection: 'column', animation: 'sheetIn .28s ease'
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 4, background: 'var(--border)', margin: '4px auto 14px' }} />
        <div className="spread" style={{ marginBottom: 14 }}>
          <span className="screen-title">{title}</span>
          <button className="tap" onClick={onClose} style={{ color: 'var(--muted)', display: 'flex' }} aria-label="Fermer">
            <X size={22} />
          </button>
        </div>
        <div className="screen-scroll" style={{ flex: '0 1 auto' }}>{children}</div>
        {footer && <div style={{ paddingTop: 14 }}>{footer}</div>}
      </div>
    </div>
  )
}

/* ---------- Champ étiqueté ---------- */
export function Field({ label, icon, textarea, ...props }) {
  return (
    <label className="stack" style={{ gap: 8, marginBottom: 16 }}>
      {label && <span className="label">{label}</span>}
      <div className={icon ? 'field-icon' : ''}>
        {icon && <span className="ic">{icon}</span>}
        {textarea
          ? <textarea className="field" {...props} />
          : <input className="field" {...props} />}
      </div>
    </label>
  )
}

/* ---------- Bouton ---------- */
export function Button({ variant = 'primary', children, className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} tap ${className}`} {...props}>
      {children}
    </button>
  )
}

/* ---------- État vide ---------- */
export function EmptyState({ icon, title, text }) {
  return (
    <div className="center stack" style={{ gap: 10, padding: '54px 30px', textAlign: 'center' }}>
      {icon && <div style={{ color: 'var(--cyan-soft)', marginBottom: 4 }}>{icon}</div>}
      <div style={{ font: '700 15px var(--font-serif)', color: 'var(--title)' }}>{title}</div>
      {text && <div style={{ font: '400 13px var(--font-ui)', color: 'var(--muted)', lineHeight: 1.6 }}>{text}</div>}
    </div>
  )
}

/* ---------- Loader plein écran ---------- */
export function Loader() {
  return <div className="center" style={{ height: '100%' }}><div className="spinner" /></div>
}

/* ---------- Contrôle segmenté (Liste / Mois) ---------- */
export function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--field-bg)', borderRadius: 12, padding: 3 }}>
      {options.map((o) => (
        <button
          key={o.value}
          className="tap"
          onClick={() => onChange(o.value)}
          style={{
            padding: '7px 16px', borderRadius: 10, font: '600 13px var(--font-ui)',
            background: value === o.value ? 'var(--card-bg)' : 'transparent',
            color: value === o.value ? 'var(--navy)' : 'var(--muted)',
            boxShadow: value === o.value ? '0 2px 8px rgba(4,31,96,.08)' : 'none'
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Chips sélectionnables ---------- */
export function ChipSelect({ options, value, onChange, multi = false }) {
  const isOn = (v) => (multi ? value?.includes(v) : value === v)
  const toggle = (v) => {
    if (!multi) return onChange(v)
    const set = new Set(value || [])
    set.has(v) ? set.delete(v) : set.add(v)
    onChange([...set])
  }
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o.value} className={`chip tap${isOn(o.value) ? ' active' : ''}`} onClick={() => toggle(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Accordéon (FAQ) ---------- */
export function Accordion({ items }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="stack" style={{ gap: 10 }}>
      {items.map((it, i) => (
        <div key={i} className="card" style={{ overflow: 'hidden' }}>
          <button className="spread tap" onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', padding: 16, textAlign: 'left' }}>
            <span style={{ font: '600 13.5px var(--font-ui)', color: 'var(--title)', paddingRight: 12 }}>{it.question}</span>
            <CaretDown size={18} weight="bold" style={{ color: 'var(--muted)', transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
          </button>
          {open === i && (
            <div style={{ padding: '0 16px 16px', font: '400 13px var(--font-ui)', color: 'var(--body-2)', lineHeight: 1.7 }}>
              {it.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
