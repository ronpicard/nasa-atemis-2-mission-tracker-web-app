const NASA_FEED = 'https://www.nasa.gov/feed/'

export type TranscriptLine = {
  id: string
  pubTs: number
  zulu: string
  title: string
  body: string
  link: string
}

function stripTags(html: string) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function isArtemisRelated(title: string, body: string) {
  const t = `${title} ${body}`.toLowerCase()
  const lunarCrew =
    t.includes('moon') && t.includes('nasa') && (t.includes('crew') || t.includes('mission'))
  return t.includes('artemis') || t.includes('orion') || t.includes('sls') || lunarCrew
}

function parsePubTs(pub: string): number {
  const d = new Date(pub)
  return Number.isNaN(d.getTime()) ? 0 : d.getTime()
}

function parseItemsFromXml(xml: string): TranscriptLine[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const items = [...doc.querySelectorAll('item')]
  const lines: TranscriptLine[] = []
  for (const el of items) {
    const title = el.querySelector('title')?.textContent?.trim() ?? ''
    const encoded = [...el.getElementsByTagName('*')].find(
      (node) =>
        node.tagName === 'content:encoded' ||
        (node.localName === 'encoded' && node.namespaceURI?.includes('purl.org')),
    )
    const desc =
      encoded?.textContent ?? el.querySelector('description')?.textContent ?? ''
    const link = el.querySelector('link')?.textContent?.trim() ?? ''
    const pub = el.querySelector('pubDate')?.textContent?.trim() ?? ''
    const body = stripTags(desc).slice(0, 1200)
    if (!title || !isArtemisRelated(title, body)) continue
    const pubTs = parsePubTs(pub)
    const zulu = pub
      ? new Date(pub).toISOString().replace('T', ' ').slice(0, 19) + ' Z'
      : ''
    lines.push({
      id: link || `${title}-${pub}`,
      pubTs,
      zulu,
      title,
      body,
      link,
    })
  }
  return lines
}

/** WordPress RSS: page 1 = newest posts; higher page numbers = older history. */
export async function fetchNasaFeedPage(page: number): Promise<{ lines: TranscriptLine[]; rawItemCount: number }> {
  const url = page <= 1 ? NASA_FEED : `${NASA_FEED}?paged=${page}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`RSS ${res.status}`)
  const xml = await res.text()
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const rawItemCount = doc.querySelectorAll('item').length
  const lines = parseItemsFromXml(xml)
  return { lines, rawItemCount }
}

export function mergeById(existing: TranscriptLine[], incoming: TranscriptLine[]): TranscriptLine[] {
  const map = new Map<string, TranscriptLine>()
  for (const x of existing) map.set(x.id, x)
  for (const x of incoming) map.set(x.id, x)
  return [...map.values()].sort((a, b) => b.pubTs - a.pubTs)
}

/** @deprecated use fetchNasaFeedPage for pagination */
export async function fetchArtemisFeed(maxItems = 24): Promise<TranscriptLine[]> {
  const { lines } = await fetchNasaFeedPage(1)
  return lines.slice(0, maxItems)
}
