const { useEffect, useState } = React

function jobStatusLabel(value) {
  return {
    new: 'Přijato ke zpracování',
    waiting_for_review: 'Přijato ke zpracování',
    waiting_for_client_details: 'Potřebujeme doplnit údaje',
    ready_to_offer: 'Hledáme pro vás malíře',
    offered_to_painter: 'Hledáme pro vás malíře',
    painter_accepted: 'Malíř byl nalezen — čeká na finální potvrzení',
    assigned: 'Malíř přiřazen',
    confirmed_to_client: 'Malíř potvrzen — brzy vás kontaktuje',
    in_progress: 'Probíhá malování',
    completed: 'Dokončeno',
    cancelled: 'Zrušeno',
  }[value] || value
}

function StatusApp() {
  const [data, setData] = useState({ loading: true, error: '', job: null, events: [], mode: '' })
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const params = new URLSearchParams(location.search)
  const token = params.get('token') || ''
  const mode = params.get('mode') || ''
  const cancelToken = params.get('cancelToken') || ''

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/public/job?token=${encodeURIComponent(token)}`)
      const json = await res.json()
      if (!res.ok) {
        setData({ loading: false, error: json.error || 'Zakázku se nepodařilo načíst.', job: null, events: [], mode })
        return
      }
      setData({ loading: false, error: '', ...json, mode })
      setForm({
        name: json.job.client_name || '',
        phone: json.job.client_phone || '',
        email: json.job.client_email || '',
        address: json.job.client_address || '',
        notes: json.job.client_note || '',
      })
    }
    load()
  }, [token, mode])

  async function complete() {
    const res = await fetch('/api/public/job-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...form }),
    })
    const json = await res.json()
    if (!res.ok) {
      setData((prev) => ({ ...prev, error: json.error || 'Uložení se nepodařilo.' }))
      return
    }
    location.reload()
  }

  async function cancelJob() {
    const res = await fetch('/api/public/job-cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelToken }),
    })
    const json = await res.json()
    if (!res.ok) {
      setData((prev) => ({ ...prev, error: json.error || 'Zrušení se nepodařilo.' }))
      return
    }
    location.reload()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0ece6', padding: 24 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', background: '#fff', borderRadius: 28, border: '1px solid rgba(175,165,148,0.28)', padding: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#2a7a4e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Stav zakázky</div>
        {data.loading ? <p>Načítám…</p> : null}
        {data.error ? <p style={{ color: '#b54d43' }}>{data.error}</p> : null}
        {data.job ? (
          <>
            <h1 style={{ fontSize: 34, fontWeight: 400, color: '#18170f', letterSpacing: '-0.05em', margin: '0 0 12px' }}>{data.job.reference}</h1>
            <p style={{ fontSize: 15, color: '#7a7268', lineHeight: 1.7, margin: '0 0 20px' }}>
              {
                data.job.status === 'waiting_for_client_details'
                  ? 'Potřebujeme doplnit pár údajů, abychom mohli najít vhodného malíře. Vyplňte prosím formulář níže.'
                  : data.job.status === 'confirmed_to_client' || data.job.status === 'painter_accepted'
                  ? `Malíř ${data.job.selected_painter_name ? data.job.selected_painter_name : ''} byl přiřazen na vaši zakázku a brzy vás kontaktuje napřímo.`.trim()
                  : data.job.status === 'completed'
                  ? 'Zakázka byla dokončena. Děkujeme za důvěru!'
                  : data.job.status === 'cancelled'
                  ? 'Zakázka byla zrušena.'
                  : 'Zakázku jsme přijali ke zpracování. Ověříme dostupnost vhodného malíře pro vámi preferovaný termín. Jakmile bude malíř potvrzený, pošleme vám jeho jméno a bude vás kontaktovat napřímo.'
              }
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              <Box label="Stav" value={jobStatusLabel(data.job.status)} />
              <Box label="Termín" value={`${data.job.preferred_date_label || '—'} · ${data.job.preferred_time_label || '—'}`} />
              <Box label="Lokalita" value={data.job.client_address || 'Bude doplněna'} />
              <Box label="Orientační cena" value={data.job.estimated_price_high ? `${new Intl.NumberFormat('cs-CZ').format(data.job.estimated_price_high)} Kč` : '—'} />
            </div>

            {mode === 'cancel' && !['completed', 'cancelled'].includes(data.job.status) ? (
              <button onClick={cancelJob} style={{ padding: '13px 18px', borderRadius: 14, border: '1px solid rgba(181,77,67,0.28)', background: '#fff', color: '#b54d43', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>Zrušit zakázku</button>
            ) : null}

            {data.job.status === 'waiting_for_client_details' ? (
              <div style={{ marginTop: 22 }}>
                <h2 style={{ fontSize: 22, fontWeight: 400, color: '#18170f', letterSpacing: '-0.04em' }}>Doplnění údajů</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jméno" style={input()} />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefon" style={input()} />
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail" style={input()} />
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Adresa" style={input()} />
                </div>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Poznámka" style={{ ...input(), minHeight: 100, marginTop: 12, resize: 'vertical' }} />
                <button onClick={complete} style={{ padding: '13px 18px', borderRadius: 14, border: 'none', background: '#2a7a4e', color: '#fff', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", marginTop: 12 }}>Uložit doplnění</button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}

function input() {
  return {
    width: '100%',
    padding: '13px 14px',
    borderRadius: 14,
    border: '1px solid rgba(175,165,148,0.28)',
    fontSize: 14,
    fontFamily: "'Outfit', sans-serif",
    outline: 'none',
  }
}

function Box({ label, value }) {
  return (
    <div style={{ border: '1px solid rgba(175,165,148,0.28)', borderRadius: 18, padding: 16 }}>
      <div style={{ fontSize: 12, color: '#b8b0a4', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 15, color: '#18170f', lineHeight: 1.6 }}>{value}</div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<StatusApp />)
