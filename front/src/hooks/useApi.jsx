import { useState, useEffect, useCallback } from 'react'

/**
 * Hook générique pour les appels API.
 * @param {Function} apiFn   - fonction qui retourne une Promise axios
 * @param {any[]}    deps    - dépendances (comme useEffect)
 * @param {boolean}  immediate - lancer dès le montage (défaut: true)
 */
export function useApi(apiFn, deps = [], immediate = true) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError]     = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      setData(res.data)
      return res.data
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue')
      throw err
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line

  useEffect(() => {
    if (immediate) execute()
  }, [immediate]) // eslint-disable-line

  return { data, loading, error, execute, setData }
}