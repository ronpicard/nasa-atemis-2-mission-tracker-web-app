import { useEffect, useState } from 'react'

export type ClockStrings = {
  zulu: string
  local: string
  localZone: string
}

function formatZulu(d: Date) {
  return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' Z')
}

function formatLocal(d: Date) {
  return d.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function useClock(tickMs = 1000) {
  const [clocks, setClocks] = useState<ClockStrings>(() => {
    const d = new Date()
    return {
      zulu: formatZulu(d),
      local: formatLocal(d),
      localZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  })

  useEffect(() => {
    const id = window.setInterval(() => {
      const d = new Date()
      setClocks({
        zulu: formatZulu(d),
        local: formatLocal(d),
        localZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    }, tickMs)
    return () => window.clearInterval(id)
  }, [tickMs])

  return clocks
}
