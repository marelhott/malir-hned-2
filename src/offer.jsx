const { useEffect, useState } = React

const C = {
  bg: '#f0ece6',
  surface: '#ffffff',
  border: 'rgba(175,165,148,0.28)',
  text: '#18170f',
  textMid: '#7a7268',
  textLight: '#b8b0a4',
  accent: '#2a7a4e',
  accentSoft: '#e6f3ec',
}

function OfferApp() {
  const [state, setState] = useState({ loading: true, error: '', offer: null, job: null, painter: null, done: '' })

  async function load() {
    const token = new URLSearchParams(location.search).get('token')
    const res = await fetch(`/api/painter/offer?token=${encodeURIComponent(token || '')}`)
    const data = await res.json()
    if (!res.ok) {
      setState({ loading: false, error: data.error || 'Tato nabídka už není dostupná.' })
      return
    }
    setState({ loading: false, error: '', done: '', ...data })
  }

  useEffect(() => { load() }, [])

  async function respond(decision) {
    const token = new URLSearchParams(location.search).get('token')
    const res = await fetch('/api/painter/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, decision }),
    })
    const data = await res.json()
    if (!res.ok) {
      setState((prev) => ({ ...prev, error: data.error || 'Reakce se nepodařila uložit.' }))
      return
    }
    setState((prev) => ({ ...prev, done: decision === 'accept' ? 'Nabídka byla přijata. Čeká na finální potvrzení dispečinku.' : 'Nabídka byla odmítnuta.' }))
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 24 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 28, padding: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Nabídka práce</div>
        {state.loading ? <p>Načítám…</p> : null}
        {!state.loading && state.error ? (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 400, color: C.text, letterSpacing: '-0.05em' }}>Tato nabídka už není dostupná.</h1>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7 }}>{state.error}</p>
          </>
        ) : null}
        {!state.loading && state.offer && state.job ? (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 400, color: C.text, letterSpacing: '-0.05em', margin: '0 0 12px' }}>{state.job.approximate_location}</h1>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.7, margin: '0 0 20px' }}>
              Preferovaný termín {state.job.preferred_date_label || '—'} · {state.job.preferred_time_label || '—'}
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              <Card label="Rozsah" value={`${state.job.custom_area || '—'} m² · ${state.job.property_type || 'Zakázka'}`} />
              <Card label="Typ práce" value={`${state.job.work_type || '—'} · ${state.job.repairs || '—'}`} />
              <Card label="Poznámka" value={state.offer.sanitized_note || 'Bez poznámky'} />
              <Card label="Nabízená odměna" value={`${new Intl.NumberFormat('cs-CZ').format(state.offer.offered_payout || 0)} Kč`} />
              <Card label="Reagovat do" value={new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(state.offer.expires_at))} />
            </div>
            {state.job.client_phone ? (
              <div style={{ marginTop: 18, padding: 16, borderRadius: 18, background: C.accentSoft, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Zakázka finálně potvrzena</div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7 }}>
                  {state.job.client_name || 'Klient'} · {state.job.client_phone || '—'}<br />
                  {state.job.address || state.job.client_address || 'Adresa bude doplněna'}
                </div>
              </div>
            ) : null}
            {state.done ? <p style={{ fontSize: 14, color: C.accent, marginTop: 18 }}>{state.done}</p> : (
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => respond('accept')} style={{ padding: '13px 18px', borderRadius: 14, border: 'none', background: C.accent, color: '#fff', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>Přijímám</button>
                <button onClick={() => respond('decline')} style={{ padding: '13px 18px', borderRadius: 14, border: `1px solid ${C.border}`, background: '#fff', color: C.textMid, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>Nemůžu</button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

function Card({ label, value }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, padding: 16 }}>
      <div style={{ fontSize: 12, color: C.textLight, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 15, color: C.text, lineHeight: 1.6 }}>{value}</div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<OfferApp />)
