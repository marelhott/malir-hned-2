const { useEffect, useMemo, useState } = React

const UI = {
  bg: '#f0ece6',
  surface: '#ffffff',
  border: 'rgba(175,165,148,0.28)',
  text: '#18170f',
  textMid: '#7a7268',
  textLight: '#b8b0a4',
  accent: '#2a7a4e',
  accentSoft: '#e6f3ec',
  danger: '#b54d43',
  dangerSoft: '#fbeceb',
  shadow: '0 2px 8px rgba(20,14,6,0.04), 0 24px 64px rgba(20,14,6,0.09)',
}

function money(value) {
  if (!Number.isFinite(Number(value))) return '—'
  return `${new Intl.NumberFormat('cs-CZ').format(Number(value))} Kč`
}

function dt(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function waitLabel(value) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime())
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'právě teď'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  return `${hours} h ${mins % 60} min`
}

function jobStatusLabel(value) {
  return {
    new: 'Nová',
    waiting_for_review: 'Čeká na kontrolu',
    waiting_for_client_details: 'Čeká na doplnění',
    ready_to_offer: 'Připravená k nabídnutí',
    offered_to_painter: 'Nabídnuto malíři',
    painter_accepted: 'Malíř přijal',
    assigned: 'Přiřazeno',
    confirmed_to_client: 'Potvrzeno klientovi',
    in_progress: 'V řešení',
    completed: 'Dokončeno',
    cancelled: 'Zrušeno',
  }[value] || value
}

function offerStatusLabel(value) {
  return {
    pending: 'Čeká na reakci',
    accepted: 'Přijatá',
    declined: 'Odmítnutá',
    expired: 'Prošlá',
    withdrawn: 'Stažená',
  }[value] || value
}

function availabilityLabel(value) {
  return {
    available: 'Dostupný',
    limited: 'Omezeně dostupný',
    unavailable: 'Nedostupný',
  }[value] || value
}

function Login({ onLogin, loading, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: UI.bg, padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, background: UI.surface, border: `1px solid ${UI.border}`, borderRadius: 26, boxShadow: UI.shadow, padding: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Admin / Dispečink</div>
        <h1 style={{ fontSize: 32, fontWeight: 400, color: UI.text, letterSpacing: '-0.05em', margin: '0 0 10px' }}>Přihlášení</h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: UI.textMid, margin: '0 0 20px' }}>Interní provozní rozhraní pro zpracování zakázek a odesílání nabídek malířům.</p>
        <div style={{ display: 'grid', gap: 12 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail admina" style={inputStyle()} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Heslo" style={inputStyle()} />
          {error ? <div style={{ color: UI.danger, fontSize: 13 }}>{error}</div> : null}
          <button onClick={() => onLogin({ email, password })} disabled={loading} style={primaryButton()}>
            {loading ? 'Přihlašuji…' : 'Přihlásit'}
          </button>
        </div>
      </div>
    </div>
  )
}

function inputStyle() {
  return {
    width: '100%',
    padding: '13px 14px',
    borderRadius: 14,
    border: `1px solid ${UI.border}`,
    fontSize: 14,
    fontFamily: "'Outfit', sans-serif",
    outline: 'none',
  }
}

function primaryButton(color = UI.accent) {
  return {
    padding: '13px 16px',
    borderRadius: 14,
    border: 'none',
    background: color,
    color: '#fff',
    cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
  }
}

function ghostButton() {
  return {
    padding: '11px 14px',
    borderRadius: 14,
    border: `1px solid ${UI.border}`,
    background: '#fff',
    color: UI.textMid,
    cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
  }
}

function App() {
  const [session, setSession] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [painters, setPainters] = useState([])
  const [form, setForm] = useState({ reason: '', confirmedPrice: '', painterPayout: '', painterId: '' })
  const [busyAction, setBusyAction] = useState('')
  const [message, setMessage] = useState('')

  const selectedJob = detail?.job || null

  async function fetchSession() {
    const res = await fetch('/api/admin/session')
    const data = await res.json()
    if (data.authenticated) {
      setSession(data.admin)
      await Promise.all([fetchJobs(), fetchPainters()])
    }
    setLoading(false)
  }

  async function fetchJobs() {
    const res = await fetch('/api/admin/jobs')
    const data = await res.json()
    if (res.ok) {
      setJobs(data.jobs)
      if (!selectedId && data.jobs[0]) setSelectedId(data.jobs[0].id)
    }
  }

  async function fetchPainters() {
    const res = await fetch('/api/admin/painters')
    const data = await res.json()
    if (res.ok) setPainters(data.painters)
  }

  async function fetchDetail(jobId) {
    if (!jobId) return
    const res = await fetch(`/api/admin/job?id=${encodeURIComponent(jobId)}`)
    const data = await res.json()
    if (res.ok) {
      setDetail(data)
      setForm((prev) => ({
        ...prev,
        confirmedPrice: data.job.confirmed_price || data.job.estimated_price_high || '',
        painterPayout: data.job.painter_payout || '',
      }))
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (session && selectedId) fetchDetail(selectedId)
  }, [session, selectedId])

  const orderedJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [jobs],
  )

  async function login(payload) {
    setLoginError('')
    setLoading(true)
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setLoginError(data.error || 'Přihlášení se nepodařilo.')
      setLoading(false)
      return
    }
    setSession({ email: data.email })
    await Promise.all([fetchJobs(), fetchPainters()])
    setLoading(false)
  }

  async function doAction(action, extra = {}) {
    if (!selectedJob) return
    setBusyAction(action)
    setMessage('')
    const res = await fetch('/api/admin/job-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: selectedJob.id, action, ...extra }),
    })
    const data = await res.json()
    setBusyAction('')
    if (!res.ok) {
      setMessage(data.error || 'Akce se nepodařila.')
      return
    }
    setMessage(action === 'send_offer' && data.result.offerUrl ? `Nabídka připravena: ${data.result.offerUrl}` : 'Uloženo.')
    await Promise.all([fetchJobs(), fetchDetail(selectedJob.id)])
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setSession(null)
    setSelectedId(null)
    setDetail(null)
    setJobs([])
  }

  if (loading && !session) return <Login onLogin={login} loading={loading} error={loginError} />
  if (!session) return <Login onLogin={login} loading={loading} error={loginError} />

  return (
    <div style={{ minHeight: '100vh', background: UI.bg, padding: 24 }}>
      <div style={{ maxWidth: 1480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Malíř Hned / Dispečink</div>
            <h1 style={{ fontSize: 36, fontWeight: 400, color: UI.text, letterSpacing: '-0.06em', margin: '6px 0 0' }}>Fronta zakázek</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: UI.textMid }}>{session.email}</span>
            <button style={ghostButton()} onClick={logout}>Odhlásit</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20 }}>
          <div style={{ background: UI.surface, borderRadius: 26, border: `1px solid ${UI.border}`, boxShadow: UI.shadow, overflow: 'hidden' }}>
            <div style={{ padding: 18, borderBottom: `1px solid ${UI.border}`, fontSize: 13, color: UI.textMid }}>
              {orderedJobs.length} zakázek ve frontě
            </div>
            <div style={{ maxHeight: '75vh', overflow: 'auto' }}>
              {orderedJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedId(job.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: `1px solid ${UI.border}`,
                    background: selectedId === job.id ? UI.accentSoft : '#fff',
                    padding: 18,
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <strong style={{ color: UI.text, fontSize: 15 }}>{job.reference}</strong>
                    <span style={{ fontSize: 12, color: UI.textMid }}>{waitLabel(job.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 14, color: UI.text, marginBottom: 6 }}>{job.approximate_location || 'Bez lokality'} · {job.property_type || 'Zakázka'}</div>
                  <div style={{ fontSize: 13, color: UI.textMid, lineHeight: 1.5 }}>{job.preferred_date_label || 'Bez termínu'} · {job.preferred_time_label || 'Čas neurčen'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 10, fontSize: 12, color: UI.textMid }}>
                    <span>{jobStatusLabel(job.status)}</span>
                    <span>{money(job.estimated_price_high)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: UI.textLight, marginTop: 6 }}>{job.best_painter_status || 'Bez doporučení'}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: UI.surface, borderRadius: 26, border: `1px solid ${UI.border}`, boxShadow: UI.shadow, minHeight: 600 }}>
            {!selectedJob ? (
              <div style={{ padding: 32, color: UI.textMid }}>Vyberte zakázku.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
                <div style={{ padding: 24, borderBottom: `1px solid ${UI.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{selectedJob.reference}</div>
                      <h2 style={{ fontSize: 30, fontWeight: 400, color: UI.text, letterSpacing: '-0.05em', margin: '6px 0 8px' }}>{selectedJob.client_name || 'Klient bez jména'}</h2>
                      <div style={{ fontSize: 14, color: UI.textMid, lineHeight: 1.6 }}>{selectedJob.client_address || 'Adresa bude doplněna'}</div>
                    </div>
                      <div style={{ fontSize: 13, color: UI.textMid }}>
                      <div>Stav: <strong style={{ color: UI.text }}>{jobStatusLabel(selectedJob.status)}</strong></div>
                      <div>Čeká: {waitLabel(selectedJob.created_at)}</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 24, overflow: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
                    <div style={{ display: 'grid', gap: 18 }}>
                      <Panel title="Zadání klienta">
                        <KV label="Kontakt" value={`${selectedJob.client_phone || '—'} · ${selectedJob.client_email || '—'}`} />
                        <KV label="Preferovaný termín" value={`${selectedJob.preferred_date_label || '—'} · ${selectedJob.preferred_time_label || '—'}`} />
                        <KV label="Typ práce" value={`${selectedJob.work_type || '—'} · ${selectedJob.repairs || '—'}`} />
                        <KV label="Rozsah" value={`${selectedJob.custom_area || '—'} m² · ${selectedJob.property_type || '—'}`} />
                        <KV label="Poznámka" value={selectedJob.booking_note || selectedJob.client_note || 'Bez poznámky'} />
                      </Panel>

                      <Panel title="Zpracování">
                        <div style={{ display: 'grid', gap: 10 }}>
                          <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Důvod pro doplnění údajů" style={{ ...inputStyle(), minHeight: 92, resize: 'vertical' }} />
                          <button style={ghostButton()} disabled={busyAction === 'request_completion'} onClick={() => doAction('request_completion', { reason: form.reason })}>Vyžádat doplnění</button>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <input value={form.confirmedPrice} onChange={(e) => setForm({ ...form, confirmedPrice: e.target.value })} placeholder="Potvrzená cena klientovi" style={inputStyle()} />
                            <input value={form.painterPayout} onChange={(e) => setForm({ ...form, painterPayout: e.target.value })} placeholder="Odměna malíři" style={inputStyle()} />
                          </div>
                          <button style={primaryButton()} disabled={busyAction === 'prepare_job'} onClick={() => doAction('prepare_job', { confirmedPrice: form.confirmedPrice, painterPayout: form.painterPayout })}>Připravit k nabídnutí</button>

                          <select value={form.painterId} onChange={(e) => setForm({ ...form, painterId: e.target.value })} style={inputStyle()}>
                            <option value="">Vyberte malíře</option>
                            {(detail?.recommendedPainters?.length ? detail.recommendedPainters : painters).map((painter) => <option key={painter.id} value={painter.id}>{painter.name} · {painter.display_status || painter.role}</option>)}
                          </select>
                          <button style={primaryButton()} disabled={!form.painterId || busyAction === 'send_offer'} onClick={() => doAction('send_offer', { painterId: form.painterId })}>Poslat nabídku malíři</button>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            <button style={ghostButton()} disabled={busyAction === 'confirm_assignment'} onClick={() => doAction('confirm_assignment')}>Finálně potvrdit přiřazení</button>
                            <button style={ghostButton()} disabled={busyAction === 'return_to_dispatch'} onClick={() => doAction('return_to_dispatch')}>Vrátit do dispečinku</button>
                            <button style={ghostButton()} disabled={busyAction === 'mark_in_progress'} onClick={() => doAction('mark_in_progress')}>Označit jako v řešení</button>
                            <button style={ghostButton()} disabled={busyAction === 'mark_done'} onClick={() => doAction('mark_done')}>Dokončeno</button>
                            <button style={{ ...ghostButton(), color: UI.danger, borderColor: 'rgba(181,77,67,0.28)' }} disabled={busyAction === 'cancel_job'} onClick={() => doAction('cancel_job')}>Zrušit zakázku</button>
                          </div>
                          {message ? <div style={{ fontSize: 13, color: message.startsWith('Nabídka') ? UI.accent : UI.textMid }}>{message}</div> : null}
                        </div>
                      </Panel>
                    </div>

                    <div style={{ display: 'grid', gap: 18 }}>
                      <Panel title="Nabídky malířům">
                        {(detail?.offers || []).length ? detail.offers.map((offer) => (
                          <div key={offer.id} style={{ padding: '12px 0', borderBottom: `1px solid ${UI.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                              <strong style={{ fontSize: 14, color: UI.text }}>{offer.painter_name}</strong>
                              <span style={{ fontSize: 12, color: UI.textMid }}>{offerStatusLabel(offer.status)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: UI.textMid, marginTop: 4 }}>{dt(offer.created_at)} · exp. {dt(offer.expires_at)}</div>
                            {offer.status === 'pending' ? <button style={{ ...ghostButton(), marginTop: 8 }} onClick={() => doAction('withdraw_offer', { offerId: offer.id })}>Stáhnout nabídku</button> : null}
                          </div>
                        )) : <div style={{ color: UI.textMid, fontSize: 13 }}>Zatím bez nabídek.</div>}
                      </Panel>

                      <Panel title="Vhodní malíři">
                        {(detail?.recommendedPainters || []).length ? detail.recommendedPainters.map((painter) => (
                          <div key={painter.id} style={{ padding: '12px 0', borderBottom: `1px solid ${UI.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                              <strong style={{ fontSize: 14, color: UI.text }}>{painter.name}</strong>
                              <span style={{ fontSize: 12, color: UI.textMid }}>{availabilityLabel(painter.availability_status)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: UI.textMid, marginTop: 4 }}>{painter.display_status}</div>
                            <div style={{ fontSize: 12, color: UI.textLight, marginTop: 4 }}>Kapacita: {painter.remaining_capacity} · Lokalita: {painter.locality_match ? 'sedí' : 'mimo lokalitu'} · Expres: {painter.accepts_express ? 'ano' : 'ne'}</div>
                            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button style={ghostButton()} onClick={() => setForm((prev) => ({ ...prev, painterId: painter.id }))}>Vybrat do nabídky</button>
                              {painter.portal_url ? <a href={painter.portal_url} style={{ ...ghostButton(), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Portál malíře</a> : null}
                            </div>
                          </div>
                        )) : <div style={{ color: UI.textMid, fontSize: 13 }}>Doporučení se objeví po zadání preferovaného dne.</div>}
                      </Panel>

                      <Panel title="Historie">
                        {(detail?.events || []).length ? detail.events.map((event) => (
                          <div key={event.id} style={{ padding: '10px 0', borderBottom: `1px solid ${UI.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 13, color: UI.text }}>{event.event_type}</span>
                              <span style={{ fontSize: 12, color: UI.textMid }}>{dt(event.created_at)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: UI.textMid, marginTop: 4 }}>{event.actor_label}</div>
                          </div>
                        )) : <div style={{ color: UI.textMid, fontSize: 13 }}>Historie je zatím prázdná.</div>}
                      </Panel>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div style={{ border: `1px solid ${UI.border}`, borderRadius: 20, padding: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function KV({ label, value }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: `1px solid ${UI.border}` }}>
      <div style={{ fontSize: 12, color: UI.textLight, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: UI.text, lineHeight: 1.6 }}>{value}</div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
