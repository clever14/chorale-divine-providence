import { useState, useEffect, useCallback } from 'react'

/**
 * Exécute une fonction async au montage (et à chaque changement de `deps`).
 * Renvoie { data, loading, error, reload }.
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try {
      const data = await fn()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({ data: null, loading: false, error })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])

  return { ...state, reload: run }
}
