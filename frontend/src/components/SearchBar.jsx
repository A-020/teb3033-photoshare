import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FILTER_KEYS, TEXT_KEYS } from '../filters'

const DEBOUNCE_MS = 300

function readText(params) {
  return Object.fromEntries(TEXT_KEYS.map((k) => [k, (params.get(k) || '').trim()]))
}

// All filters live in the URL (useSearchParams), so a filtered view
// can be bookmarked, shared or restored with the Back button.
export default function SearchBar() {
  const [searchParams, setSearchParams] = useSearchParams()

  // What the user is typing, before it is written to the URL
  const [draft, setDraft] = useState(() => readText(searchParams))
  // The text values last written to (or read from) the URL
  const written = useRef(readText(searchParams))

  // The URL changed from outside (Clear filters, Back button): show it in the boxes
  useEffect(() => {
    const fromUrl = readText(searchParams)
    if (TEXT_KEYS.some((k) => fromUrl[k] !== written.current[k])) {
      written.current = fromUrl
      setDraft(fromUrl)
    }
  }, [searchParams])

  // Typing: wait 300 ms after the last keystroke, then update the URL.
  // This sends one request per pause instead of one per key.
  useEffect(() => {
    const trimmed = Object.fromEntries(TEXT_KEYS.map((k) => [k, draft[k].trim()]))
    if (TEXT_KEYS.every((k) => trimmed[k] === written.current[k])) return

    const timer = setTimeout(() => {
      written.current = trimmed
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const k of TEXT_KEYS) {
          if (trimmed[k]) next.set(k, trimmed[k])
          else next.delete(k)
        }
        return next
      })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, setSearchParams])

  function setText(key, value) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  // Dates and sort change the URL immediately
  function setParam(key, value) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  // Removes every search filter but keeps the chosen group
  function clearFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams()
      if (prev.get('groupId')) next.set('groupId', prev.get('groupId'))
      return next
    })
  }

  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const active = FILTER_KEYS.some((k) => searchParams.get(k)) || TEXT_KEYS.some((k) => draft[k])

  return (
    <div className="card search-bar">
      <input
        className="search-q"
        type="search"
        placeholder="Search captions and comments"
        value={draft.q}
        onChange={(e) => setText('q', e.target.value)}
        maxLength={100}
      />
      <input placeholder="Uploader" value={draft.uploader} onChange={(e) => setText('uploader', e.target.value)} />
      <input placeholder="Tag" value={draft.tag} onChange={(e) => setText('tag', e.target.value)} />
      <label className="inline-label">
        From
        <input type="date" value={from} max={to || undefined} onChange={(e) => setParam('from', e.target.value)} />
      </label>
      <label className="inline-label">
        To
        <input type="date" value={to} min={from || undefined} onChange={(e) => setParam('to', e.target.value)} />
      </label>
      <select value={searchParams.get('sort') || 'newest'} onChange={(e) => setParam('sort', e.target.value === 'newest' ? '' : e.target.value)}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
      <button type="button" className="btn btn-ghost" onClick={clearFilters} disabled={!active}>
        Clear filters
      </button>
    </div>
  )
}
