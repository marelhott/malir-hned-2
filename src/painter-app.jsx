const { useEffect, useMemo, useState } = React

const C = {
  bg: '#f0ece6',
  surface: '#ffffff',
  border: 'rgba(175,165,148,0.28)',
  text: '#18170f',
  textMid: '#7a7268',
  textLight: '#b8b0a4',
  accent: '#2a7a4e',
  accentSoft: '#e6f3ec',
  danger: '#b54d43',
  shadow: '0 2px 8px rgba(20,14,6,0.04), 0 24px 64px rgba(20,14,6,0.09)',
}

function field() {
  return {
    width: '100%',
    padding: '11px 12px',
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: '#fff',
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
    outline: 'none',
  }
}

function fmtDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('cs-CZ', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00Z`))
}

function App() {
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [])
  const [state, setState] = useState({ loading: true, error: '', painter: null, availability: [] })
  const [saving, setSaving] = useState('')
  const [painterNote, setPainterNote] = useState('')

  async function load() {
    const response = await fetch(`/api/painter/portal?token=${encodeURIComponent(token)}`)
    const data = await response.json()
    if (!response.ok) {
      setState({ loading: false, error: data.error || 'Portál se nepodařilo načíst.', painter: null, availability: [] })
      return
    }
    setPainterNote(data.painter?.notes || '')
    setState({ loading: false, error: '', painter: data.painter, availability: data.availability || [] })
  }

  useEffect(() => {
    load()
  }, [token])

  async function save(payload, savingKey) {
    setSaving(savingKey)
    const response = await fetch('/api/painter/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...payload }),
    })
    const data = await response.json()
    setSaving('')
    if (!response.ok) {
      setState((prev) => ({ ...prev, error: data.error || 'Uložení se nepodařilo.' }))
      return
    }
    setPainterNote(data.painter?.notes || '')
    setState((prev) => ({ ...prev, error: '', painter: data.painter, availability: data.availability || prev.availability }))
  }

  function updateDay(row, patch) {
    save({
      entries: [{
        date: row.date,
        status: patch.status ?? row.status,
        capacity: patch.capacity ?? row.capacity,
        accepts_express: patch.accepts_express ?? row.accepts_express,
        note: patch.note ?? row.note,
        source: 'painter',
      }],
    }, row.date)
  }

  if (state.loading) {
    return <div style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center' }}>Načítám…</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 14 }}>
      <div style={{ maxWidth: 430, margin: '0 auto', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, boxShadow: C.shadow, overflow: 'hidden' }}>
        <div style={{ padding: 18, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Kalendář malíře</div>
          <div style={{ fontSize: 24, fontWeight: 400, color: C.text, letterSpacing: '-0.04em' }}>{state.painter?.name || 'Malíř'}</div>
          <div style={{ fontSize: 13, color: C.textMid, marginTop: 6 }}>Jednoduchá denní dostupnost pro dispečink.</div>
          {state.error ? <div style={{ fontSize: 12, color: C.danger, marginTop: 8 }}>{state.error}</div> : null}
        </div>

        <div style={{ padding: 14, display: 'grid', gap: 10 }}>
          {state.availability.slice(0, 14).map((row) => (
            <div key={row.date} style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <strong style={{ fontSize: 14, color: C.text }}>{fmtDate(row.date)}</strong>
                <span style={{ fontSize: 11, color: saving === row.date ? C.accent : C.textLight }}>{saving === row.date ? 'Ukládám…' : 'den'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
                {[
                  ['available', 'Volno'],
                  ['limited', 'Omezeně'],
                  ['unavailable', 'Pryč'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateDay(row, { status: value })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 12,
                      border: `1px solid ${row.status === value ? C.accent : C.border}`,
                      background: row.status === value ? C.accentSoft : '#fff',
                      color: row.status === value ? C.accent : C.textMid,
                      fontSize: 12,
                      fontFamily: "'Outfit', sans-serif",
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 8 }}>
                <input type="number" min="0" value={row.capacity ?? 1} onChange={(e) => updateDay(row, { capacity: e.target.value })} style={field()} />
                <input value={row.note || ''} onChange={(e) => updateDay(row, { note: e.target.value })} placeholder="Zpráva k tomuto dni" style={field()} />
              </div>
            </div>
          ))}

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Zpráva pro dispečink</div>
            <textarea
              value={painterNote}
              onChange={(e) => setPainterNote(e.target.value)}
              placeholder="Např. tento týden jen menší zakázky."
              style={{ ...field(), minHeight: 88, resize: 'vertical' }}
            />
            <button
              type="button"
              onClick={() => save({ painterNote }, 'note')}
              style={{ marginTop: 8, width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', background: C.accent, color: '#fff', fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}
            >
              {saving === 'note' ? 'Ukládám…' : 'Uložit zprávu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
