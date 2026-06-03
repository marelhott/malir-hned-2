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
  warm: '#f0be38',
  warmSoft: '#fef8e0',
  danger: '#b54d43',
  shadow: '0 2px 8px rgba(20,14,6,0.04), 0 24px 64px rgba(20,14,6,0.09)',
}

function inputStyle() {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
    outline: 'none',
    background: '#fff',
  }
}

function statusLabel(status) {
  return {
    available: 'Dostupný',
    limited: 'Omezeně dostupný',
    unavailable: 'Nedostupný',
  }[status] || status
}

function offerLabel(status) {
  return {
    pending: 'Čeká na reakci',
    accepted: 'Přijatá',
    declined: 'Odmítnutá',
    expired: 'Prošlá',
    withdrawn: 'Stažená',
  }[status] || status
}

function fmtDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00Z`))
}

function App() {
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [])
  const [state, setState] = useState({ loading: true, error: '', painter: null, availability: [], offers: [] })
  const [savingDate, setSavingDate] = useState('')

  async function load() {
    const response = await fetch(`/api/painter/portal?token=${encodeURIComponent(token)}`)
    const data = await response.json()
    if (!response.ok) {
      setState({ loading: false, error: data.error || 'Portál se nepodařilo načíst.', painter: null, availability: [], offers: [] })
      return
    }
    setState({ loading: false, error: '', ...data })
  }

  useEffect(() => {
    load()
  }, [token])

  async function saveRow(row, patch) {
    setSavingDate(row.date)
    const payload = {
      token,
      entries: [
        {
          date: row.date,
          status: patch.status ?? row.status,
          capacity: patch.capacity ?? row.capacity,
          accepts_express: patch.accepts_express ?? row.accepts_express,
          note: patch.note ?? row.note,
          source: 'painter',
        },
      ],
    }
    const response = await fetch('/api/painter/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    setSavingDate('')
    if (!response.ok) {
      setState((prev) => ({ ...prev, error: data.error || 'Dostupnost se nepodařilo uložit.' }))
      return
    }
    setState((prev) => ({ ...prev, error: '', painter: data.painter, availability: data.availability, offers: data.offers }))
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 16 }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 28, boxShadow: C.shadow, overflow: 'hidden' }}>
          <div style={{ padding: 24, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Malířský portál</div>
            {state.loading ? <h1 style={{ fontSize: 28, fontWeight: 400 }}>Načítám…</h1> : null}
            {!state.loading && state.error ? <p style={{ color: C.danger, fontSize: 14 }}>{state.error}</p> : null}
            {!state.loading && state.painter ? (
              <>
                <h1 style={{ fontSize: 32, fontWeight: 400, color: C.text, letterSpacing: '-0.05em', marginBottom: 8 }}>{state.painter.name}</h1>
                <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7 }}>Zde si nastavujete jednoduchou denní dostupnost. Dispečink z ní vybírá vhodného malíře a veřejný web z ní skládá agregovaný kalendář služby.</p>
              </>
            ) : null}
          </div>

          {!state.loading && state.painter ? (
            <div style={{ padding: 20, display: 'grid', gap: 20 }}>
              <section style={{ border: `1px solid ${C.border}`, borderRadius: 22, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Denní dostupnost</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {state.availability.map((row) => (
                    <div key={row.date} style={{ border: `1px solid ${C.border}`, borderRadius: 18, padding: 14, background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{fmtDate(row.date)}</div>
                          <div style={{ fontSize: 12, color: C.textMid }}>{statusLabel(row.status)}</div>
                        </div>
                        <div style={{ fontSize: 12, color: savingDate === row.date ? C.accent : C.textLight }}>
                          {savingDate === row.date ? 'Ukládám…' : 'Denní nastavení'}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        <select value={row.status} onChange={(e) => saveRow(row, { status: e.target.value })} style={inputStyle()}>
                          <option value="available">Dostupný</option>
                          <option value="limited">Omezeně dostupný</option>
                          <option value="unavailable">Nedostupný</option>
                        </select>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <input type="number" min="0" value={row.capacity ?? 1} onChange={(e) => saveRow(row, { capacity: e.target.value })} style={inputStyle()} />
                          <select value={row.accepts_express ? 'yes' : 'no'} onChange={(e) => saveRow(row, { accepts_express: e.target.value === 'yes' })} style={inputStyle()}>
                            <option value="yes">Bere expresní zakázky</option>
                            <option value="no">Nechce expresní zakázky</option>
                          </select>
                        </div>
                        <input value={row.note || ''} onChange={(e) => saveRow(row, { note: e.target.value })} placeholder="Poznámka k dostupnosti" style={inputStyle()} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ border: `1px solid ${C.border}`, borderRadius: 22, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Poslední nabídky</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {state.offers.length ? state.offers.map((offer) => (
                    <div key={offer.id} style={{ border: `1px solid ${C.border}`, borderRadius: 18, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                        <strong style={{ fontSize: 14, color: C.text }}>{offer.job?.locality || offer.approx_location || 'Zakázka'}</strong>
                        <span style={{ fontSize: 12, color: C.textMid }}>{offerLabel(offer.status)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
                        {offer.job?.preferred_date_label || 'Bez termínu'} · {offer.job?.work_type || 'Bez typu práce'}
                      </div>
                    </div>
                  )) : <div style={{ fontSize: 13, color: C.textMid }}>Zatím bez nabídek.</div>}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
