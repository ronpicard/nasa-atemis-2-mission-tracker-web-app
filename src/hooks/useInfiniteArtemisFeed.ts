import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchNasaFeedPage, mergeById, type TranscriptLine } from '../lib/nasaRss'

const REFRESH_MS = 120_000
const MAX_PAGES = 60

export function useInfiniteArtemisFeed() {
  const [lines, setLines] = useState<TranscriptLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exhausted, setExhausted] = useState(false)
  const nextPageRef = useRef(2)

  const refreshHead = useCallback(async () => {
    try {
      const { lines: fresh } = await fetchNasaFeedPage(1)
      setLines((prev) => mergeById(prev, fresh))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Feed unavailable')
    }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { lines: first, rawItemCount } = await fetchNasaFeedPage(1)
        if (!alive) return
        if (rawItemCount === 0) setExhausted(true)
        setLines(first)
        setError(null)
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Feed unavailable')
      } finally {
        if (alive) setLoadingInitial(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshHead()
    }, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [refreshHead])

  const loadOlder = useCallback(async () => {
    if (loadingMore || exhausted || loadingInitial) return
    const page = nextPageRef.current
    if (page > MAX_PAGES) {
      setExhausted(true)
      return
    }
    setLoadingMore(true)
    try {
      const { lines: older, rawItemCount } = await fetchNasaFeedPage(page)
      if (rawItemCount === 0) {
        setExhausted(true)
        return
      }
      nextPageRef.current = page + 1
      setLines((prev) => mergeById(prev, older))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load older entries')
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, exhausted, loadingInitial])

  return {
    lines,
    error,
    loadingInitial,
    loadingMore,
    exhausted,
    loadOlder,
  }
}
