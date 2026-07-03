import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

const ConfirmContext = createContext(null)
export const useConfirm = () => useContext(ConfirmContext)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [confirmState, setConfirmState] = useState(null)

  const show = useCallback((message, kind = 'info') => {
    setToast({ message, kind })
    setTimeout(() => setToast(null), 2600)
  }, [])

  const ask = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        confirmLabel: opts.confirmLabel || 'Confirmer',
        cancelLabel: opts.cancelLabel || 'Annuler',
        danger: !!opts.danger,
        resolve
      })
    })
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      <ConfirmContext.Provider value={ask}>
        {children}
        {toast && (
          <div
            style={{
              position: 'absolute', left: 20, right: 20, bottom: 'calc(24px + var(--safe-bottom))',
              zIndex: 999, padding: '13px 16px', borderRadius: 13,
              background: toast.kind === 'error' ? 'var(--red)' : toast.kind === 'success' ? 'var(--green)' : 'var(--navy)',
              color: '#fff', font: '600 13px var(--font-ui)', textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,.3)', animation: 'sheetIn .25s ease'
            }}
          >
            {toast.message}
          </div>
        )}
        {confirmState && (
          <ConfirmDialog
            state={confirmState}
            onDone={(v) => { confirmState.resolve(v); setConfirmState(null) }}
          />
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  )
}

function ConfirmDialog({ state, onDone }) {
  return (
    <div
      onClick={() => onDone(false)}
      style={{
        position: 'absolute', inset: 0, zIndex: 500, background: 'rgba(4,12,32,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        animation: 'fadeIn .18s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)', borderRadius: 18, padding: 22, width: '100%', maxWidth: 320,
          boxShadow: '0 20px 60px rgba(0,0,0,.35)', animation: 'sheetIn .25s ease'
        }}
      >
        <p style={{ font: '600 14.5px var(--font-ui)', color: 'var(--title)', lineHeight: 1.55, margin: '0 0 18px' }}>
          {state.message}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-ghost tap"
            onClick={() => onDone(false)}
          >
            {state.cancelLabel}
          </button>
          <button
            className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'} tap`}
            onClick={() => onDone(true)}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
