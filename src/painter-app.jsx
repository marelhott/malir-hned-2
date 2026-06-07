const { useEffect, useMemo, useState } = React

const C = {
  bg: '#f0ece6',
  surface: '#ffffff',
  surfaceSoft: '#f7f3ee',
  border: 'rgba(175,165,148,0.28)',
  text: '#18170f',
  textMid: '#7a7268',
  textLight: '#b8b0a4',
  accent: '#2a7a4e',
  accentSoft: '#e6f3ec',
  warn: '#b89236',
  warnSoft: '#f7eed8',
  muted: '#8b8173',
  mutedSoft: '#efe9e0',
  danger: '#b54d43',
  shadow: '0 2px 8px rgba(20,14,6,0.04), 0 24px 64px rgba(20,14,6,0.09)',
}

const STATUS_META = {
  available: { label: 'Volno', bg: C.accentSoft, text: C.accent, dot: C.accent },
  limited: { label: 'Omezeně', bg: C.warnSoft, text: C.warn, dot: C.warn },
  unavailable: { label: 'Pryč', bg: C.mutedSoft, text: C.muted, dot: C.muted },
}

const WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

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
    boxSizing: 'border-box',
  }
}

function monthStart(value) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(1)
  return date.toISOString().slice(0, 10)
}

function addMonths(value, diff) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + diff)
  return date.toISOString().slice(0, 10)
}

function pad(num) {
  return String(num).padStart(2, '0')
}

function monthLabel(value) {
  return new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00Z`))
}

function dayLabel(value) {
  return new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00:00Z`))
}

function buildMonthCells(month, availabilityMap) {
  const first = new Date(`${month}T12:00:00Z`)
  const year = first.getUTCFullYear()
  const monthIndex = first.getUTCMonth()
  const leading = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const cells = []

  for (let i = 0; i < leading; i += 1) cells.push(null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${pad(monthIndex + 1)}-${pad(day)}`
    cells.push({
      date,
      day,
      row: availabilityMap.get(date) || {
        date,
        status: 'available',
        capacity: 1,
        accepts_express: false,
        note: '',
      },
    })
  }

  while (cells.length % 7) cells.push(null)
  return cells
}

function BulkAvailability({ availabilityMap, onSave, saving }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('unavailable')
  const [done, setDone] = useState(false)

  const STATUS_LABELS = { available: 'Volno', limited: 'Omezeně', unavailable: 'Pryč' }
  const STATUS_COLORS = {
    available: { bg: '#e6f3ec', color: '#2a7a4e' },
    limited: { bg: '#f7eed8', color: '#b89236' },
    unavailable: { bg: '#efe9e0', color: '#8b8173' },
  }

  async function apply() {
    if (!from || !to || from > to) return
    const entries = []
    const cur = new Date(`${from}T12:00:00Z`)
    const end = new Date(`${to}T12:00:00Z`)
    while (cur <= end) {
      const date = cur.toISOString().slice(0, 10)
      const existing = availabilityMap.get(date) || {}
      entries.push({ date, status, capacity: status === 'unavailable' ? 0 : (existing.capacity ?? 1), accepts_express: existing.accepts_express ?? false, note: existing.note || '', source: 'painter' })
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
    const ok = await onSave({ entries }, 'bulk')
    if (ok) { setDone(true); setTimeout(() => setDone(false), 2000) }
  }

  const fieldStyle = { padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(175,165,148,0.28)', background: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: 13, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ border: '1px solid rgba(175,165,148,0.28)', borderRadius: 16, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#2a7a4e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Nastavit blok dnů</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: '#b8b0a4', marginBottom: 4 }}>Od</div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ ...fieldStyle, width: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#b8b0a4', marginBottom: 4 }}>Do</div>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ ...fieldStyle, width: '100%' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setStatus(key)} style={{ padding: '9px 6px', borderRadius: 12, border: `1px solid ${status === key ? STATUS_COLORS[key].color : 'rgba(175,165,148,0.28)'}`, background: status === key ? STATUS_COLORS[key].bg : '#fff', color: status === key ? STATUS_COLORS[key].color : '#7a7268', fontFamily: "'Outfit', sans-serif", fontSize: 12, cursor: 'pointer' }}>{label}</button>
        ))}
      </div>
      <button type="button" onClick={apply} disabled={!from || !to || saving === 'bulk'} style={{ width: '100%', padding: '11px 12px', borderRadius: 12, border: 'none', background: '#2a7a4e', color: '#fff', fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', opacity: (!from || !to) ? 0.5 : 1 }}>
        {saving === 'bulk' ? 'Ukládám…' : done ? React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 5 } }, React.createElement('svg', { width: 13, height: 13, viewBox: '0 0 13 13', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('polyline', { points: '2,7 5,10 11,3' })), 'Uloženo') : 'Použít na výběr'}
      </button>
    </div>
  )
}

function App() {
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [])
  const [state, setState] = useState({ loading: true, error: '', painter: null, availability: [] })
  const [offers, setOffers] = useState([])
  const [saving, setSaving] = useState('')
  const [painterNote, setPainterNote] = useState('')
  const [month, setMonth] = useState(monthStart(new Date().toISOString().slice(0, 10)))
  const [detailDate, setDetailDate] = useState('')
  const [draft, setDraft] = useState(null)
  const [respondingId, setRespondingId] = useState('')

  async function load() {
    const response = await fetch(`/api/painter/portal?token=${encodeURIComponent(token)}`)
    const data = await response.json()
    if (!response.ok) {
      setState({ loading: false, error: data.error || 'Portál se nepodařilo načíst.', painter: null, availability: [] })
      return
    }
    setPainterNote(data.painter?.notes || '')
    setOffers(data.offers || [])
    setState({ loading: false, error: '', painter: data.painter, availability: data.availability || [] })
  }

  useEffect(() => {
    load()
  }, [token])

  const availabilityMap = useMemo(
    () => new Map((state.availability || []).map((row) => [row.date, row])),
    [state.availability],
  )

  const monthCells = useMemo(() => buildMonthCells(month, availabilityMap), [month, availabilityMap])

  useEffect(() => {
    if (!detailDate) return
    const base = availabilityMap.get(detailDate) || {
      date: detailDate,
      status: 'available',
      capacity: 1,
      accepts_express: false,
      note: '',
    }
    setDraft({
      date: detailDate,
      status: base.status || 'available',
      capacity: base.capacity ?? 1,
      accepts_express: Boolean(base.accepts_express),
      note: base.note || '',
    })
  }, [detailDate, availabilityMap])

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
      return false
    }
    setPainterNote(data.painter?.notes || '')
    setState((prev) => ({ ...prev, error: '', painter: data.painter, availability: data.availability || prev.availability }))
    return true
  }

  async function respondOffer(offerToken, decision) {
    setRespondingId(offerToken + decision)
    const res = await fetch('/api/painter/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: offerToken, decision }),
    })
    const data = await res.json()
    setRespondingId('')
    if (!res.ok) {
      setState((prev) => ({ ...prev, error: data.error || 'Reakci se nepodařilo uložit.' }))
      return
    }
    // reload offers
    load()
  }

  async function saveDay() {
    if (!draft?.date) return
    const ok = await save({
      entries: [{
        date: draft.date,
        status: draft.status,
        capacity: draft.capacity,
        accepts_express: draft.accepts_express,
        note: draft.note,
        source: 'painter',
      }],
    }, draft.date)
    if (ok) setDetailDate('')
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
          <div style={{ fontSize: 13, color: C.textMid, marginTop: 6 }}>Zaklikejte dny, kdy můžete pracovat. Detail dne otevřete tapnutím.</div>
          {state.error ? <div style={{ fontSize: 12, color: C.danger, marginTop: 8 }}>{state.error}</div> : null}
        </div>

        <div style={{ padding: 14, display: 'grid', gap: 14 }}>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, padding: 12, background: C.surfaceSoft }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
              <button type="button" onClick={() => setMonth((prev) => addMonths(prev, -1))} style={navButton()} aria-label="Předchozí měsíc">‹</button>
              <strong style={{ fontSize: 16, color: C.text, textTransform: 'capitalize' }}>{monthLabel(month)}</strong>
              <button type="button" onClick={() => setMonth((prev) => addMonths(prev, 1))} style={navButton()} aria-label="Další měsíc">›</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
              {WEEKDAYS.map((item) => (
                <div key={item} style={{ textAlign: 'center', fontSize: 11, color: C.textLight }}>{item}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {monthCells.map((cell, index) => {
                if (!cell) return <div key={`empty-${index}`} />
                const meta = STATUS_META[cell.row.status] || STATUS_META.available
                const isSelected = detailDate === cell.date
                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => setDetailDate(cell.date)}
                    style={{
                      minHeight: 48,
                      borderRadius: 14,
                      border: `1px solid ${isSelected ? C.text : C.border}`,
                      background: meta.bg,
                      color: meta.text,
                      display: 'grid',
                      placeItems: 'center',
                      padding: 6,
                      cursor: 'pointer',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{cell.day}</div>
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: meta.dot }} />
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <div key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 999, background: meta.bg, color: meta.text, fontSize: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: meta.dot }} />
                  {meta.label}
                </div>
              ))}
            </div>
          </div>

          <BulkAvailability availabilityMap={availabilityMap} onSave={save} saving={saving} />

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

          {offers.filter(o => o.status === 'pending').length > 0 && (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Nové nabídky</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {offers.filter(o => o.status === 'pending').map((offer) => {
                  const loc = offer.approx_location || offer.job?.locality || offer.job?.service_area || '—'
                  const payout = offer.offered_payout || offer.offered_reward
                  return (
                    <div key={offer.id} style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{loc}</div>
                          {offer.job?.preferred_date_label ? <div style={{ fontSize: 12, color: C.textMid, marginTop: 3 }}>{offer.job.preferred_date_label}</div> : null}
                          {payout ? <div style={{ fontSize: 13, color: C.accent, marginTop: 4 }}>{new Intl.NumberFormat('cs-CZ').format(payout)} Kč</div> : null}
                        </div>
                        <span style={{ padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: C.warnSoft, color: C.warn, whiteSpace: 'nowrap' }}>Čeká na reakci</span>
                      </div>
                      {offer.offer_token ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <button
                            type="button"
                            disabled={!!respondingId}
                            onClick={() => respondOffer(offer.offer_token, 'accepted')}
                            style={{ padding: '10px 12px', borderRadius: 12, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', opacity: respondingId ? 0.6 : 1 }}
                          >
                            {respondingId === offer.offer_token + 'accepted' ? 'Ukládám…' : '✓ Přijmout'}
                          </button>
                          <button
                            type="button"
                            disabled={!!respondingId}
                            onClick={() => respondOffer(offer.offer_token, 'declined')}
                            style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.border}`, background: '#fff', color: C.danger, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', opacity: respondingId ? 0.6 : 1 }}
                          >
                            {respondingId === offer.offer_token + 'declined' ? 'Ukládám…' : '✗ Odmítnout'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {offers.filter(o => o.status !== 'pending').length > 0 && (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Historie nabídek</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {offers.filter(o => o.status !== 'pending').map((offer) => {
                  const statusMeta = {
                    accepted: { label: 'Přijatá', bg: C.accentSoft, color: C.accent },
                    declined: { label: 'Odmítnutá', bg: C.mutedSoft, color: C.muted },
                    expired: { label: 'Prošlá', bg: C.mutedSoft, color: C.muted },
                    withdrawn: { label: 'Stažená', bg: C.mutedSoft, color: C.muted },
                  }[offer.status] || { label: offer.status, bg: C.mutedSoft, color: C.muted }
                  const loc = offer.approx_location || offer.job?.locality || offer.job?.service_area || '—'
                  const payout = offer.offered_payout || offer.offered_reward
                  return (
                    <div key={offer.id} style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>{loc}</div>
                          {offer.job?.preferred_date_label ? <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{offer.job.preferred_date_label}</div> : null}
                          {payout ? <div style={{ fontSize: 12, color: C.textMid, marginTop: 3 }}>{new Intl.NumberFormat('cs-CZ').format(payout)} Kč</div> : null}
                        </div>
                        <span style={{ padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: statusMeta.bg, color: statusMeta.color, whiteSpace: 'nowrap' }}>{statusMeta.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {detailDate && draft ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setDetailDate('')}
          onKeyDown={(event) => { if (event.key === 'Escape') setDetailDate('') }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,14,6,0.36)', display: 'grid', alignItems: 'end', padding: 10 }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{ background: '#fff', borderRadius: '22px 22px 0 0', padding: 18, boxShadow: C.shadow, maxWidth: 430, width: '100%', margin: '0 auto' }}
          >
            <div style={{ width: 48, height: 4, borderRadius: 999, background: C.border, margin: '0 auto 14px' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Detail dne</div>
            <div style={{ fontSize: 20, color: C.text, letterSpacing: '-0.04em', marginBottom: 14 }}>{dayLabel(detailDate)}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {Object.entries(STATUS_META).map(([value, meta]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, status: value }))}
                  style={{
                    padding: '11px 8px',
                    borderRadius: 14,
                    border: `1px solid ${draft.status === value ? meta.dot : C.border}`,
                    background: draft.status === value ? meta.bg : '#fff',
                    color: draft.status === value ? meta.text : C.textMid,
                    fontSize: 12,
                    fontFamily: "'Outfit', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  {meta.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <input
                type="number"
                min="0"
                value={draft.capacity ?? 1}
                onChange={(e) => setDraft((prev) => ({ ...prev, capacity: e.target.value }))}
                placeholder="Kapacita na den"
                style={field()}
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.text }}>
                <input
                  type="checkbox"
                  checked={Boolean(draft.accepts_express)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, accepts_express: e.target.checked }))}
                />
                Bere expresní zakázky
              </label>

              <textarea
                value={draft.note || ''}
                onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Poznámka k tomuto dni"
                style={{ ...field(), minHeight: 84, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
              <button type="button" onClick={() => setDetailDate('')} style={{ ...field(), cursor: 'pointer', textAlign: 'center' }}>Zavřít</button>
              <button type="button" onClick={saveDay} style={{ padding: '11px 12px', borderRadius: 12, border: 'none', background: C.accent, color: '#fff', fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>
                {saving === draft.date ? 'Ukládám…' : 'Uložit'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function navButton() {
  return {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: `1px solid ${C.border}`,
    background: '#fff',
    color: C.text,
    cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
    fontSize: 20,
    lineHeight: 1,
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
