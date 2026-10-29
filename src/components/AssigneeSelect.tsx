import { useMemo, useRef, useState } from 'react'

interface Props {
  id: string
  options: string[]
  value: string
  onChange: (value: string) => void
  error?: string | null
}

export const normalizeName = (s: string) => s.trim().replace(/\s+/g, ' ')
const key = (s: string) => normalizeName(s).toLocaleLowerCase()

export default function AssigneeSelect({ id, options, value, onChange, error }: Props) {
  const listId = `${id}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const [added, setAdded] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  // Existing names plus any added in this session, with no case-insensitive duplicates.
  const all = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const name of [...options, ...added]) {
      const k = key(name)
      if (k && !seen.has(k)) {
        seen.add(k)
        out.push(name)
      }
    }
    return out.sort((a, b) => a.localeCompare(b))
  }, [options, added])

  const q = normalizeName(query)
  const filtered = all.filter((n) => key(n).includes(key(q)))
  const duplicate = q ? all.find((n) => key(n) === key(q)) : undefined
  const canAdd = q.length > 0 && !duplicate
  const items = [...filtered.map((n) => ({ kind: 'existing' as const, name: n })), ...(canAdd ? [{ kind: 'add' as const, name: q }] : [])]
  const duplicateError = duplicate ? `"${duplicate}" already exists. Select it from the list instead.` : null
  const shownError = duplicateError ?? error ?? null

  const choose = (item: (typeof items)[number]) => {
    if (item.kind === 'add') setAdded((prev) => [...prev, item.name])
    onChange(item.name)
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (open) {
        e.preventDefault()
        const item = items[Math.min(active, items.length - 1)]
        if (item) choose(item)
      }
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div className="combo">
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={!!shownError}
        aria-describedby={shownError ? `${id}-err` : undefined}
        aria-activedescendant={open && items.length ? `${id}-opt-${Math.min(active, items.length - 1)}` : undefined}
        autoComplete="off"
        maxLength={100}
        placeholder="Select or add an assignee"
        value={open ? query : value}
        onClick={() => setOpen(true)} // the input keeps focus after choosing, so reopen on click
        onFocus={() => {
          setOpen(true)
          setActive(0)
        }}
        onBlur={() => {
          setOpen(false)
          setQuery('')
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul id={listId} role="listbox" className="combo-list">
          {items.length === 0 && <li className="combo-empty">No assignees yet. Type a name to add one.</li>}
          {items.map((item, i) => (
            <li
              key={`${item.kind}-${item.name}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={item.kind === 'existing' && key(item.name) === key(value)}
              className={`combo-option${i === active ? ' active' : ''}${item.kind === 'add' ? ' add' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault() // keep input focus so blur doesn't close before click
                choose(item)
              }}
              onMouseEnter={() => setActive(i)}
            >
              {item.kind === 'add' ? `Add "${item.name}"` : item.name}
            </li>
          ))}
        </ul>
      )}
      {shownError && (
        <p id={`${id}-err`} className="form-error" role="alert">
          {shownError}
        </p>
      )}
    </div>
  )
}
