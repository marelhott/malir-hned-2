const { useEffect, useMemo, useState } = React

const UI = {
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

const WEEKDAYS = ['Po', 'Ut', 'St', 'Ct', 'Pa', 'So', 'Ne']

const STATUS_META = {
  available: { label: 'Dostupný', bg: UI.accentSoft, text: UI.accent },
  limited: { label: 'Omezený', bg: UI.warnSoft, text: UI.warn },
  unavailable: { label: 'Pryč', bg: UI.mutedSoft, text: UI.muted },
}

function money(value) {
  if (!Number.isFinite(Number(value))) return '—'
  return `${new Intl.NumberFormat('cs-CZ').format(Number(value))} Kc`
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

function dayLabel(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${value}T12:00:00Z`))
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
    ready_to_offer: 'Připravena k nabídnutí',
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
    pending: 'Ceka na reakci',
    accepted: 'Prijata',
    declined: 'Odmítnuta',
    expired: 'Prosla',
    withdrawn: 'Stazena',
  }[value] || value
}

function availabilityLabel(value) {
  return STATUS_META[value]?.label || value || '—'
}

function inputStyle() {
  return {
    width: '100%',
    padding: '12px 13px',
    borderRadius: 14,
    border: `1px solid ${UI.border}`,
    fontSize: 14,
    fontFamily: "'Outfit', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  }
}

function primaryButton(color = UI.accent) {
  return {
    padding: '12px 14px',
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
    padding: '10px 13px',
    borderRadius: 14,
    border: `1px solid ${UI.border}`,
    background: '#fff',
    color: UI.textMid,
    cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
  }
}

function monthStart(value) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(1)
  return date.toISOString().slice(0, 10)
}

function addMonths(value, count) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + count)
  return date.toISOString().slice(0, 10)
}

function Login({ onLogin, loading, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: UI.bg, padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, background: UI.surface, border: `1px solid ${UI.border}`, borderRadius: 26, boxShadow: UI.shadow, padding: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Admin / Dispečink</div>
        <h1 style={{ fontSize: 32, fontWeight: 400, color: UI.text, letterSpacing: '-0.05em', margin: '0 0 10px' }}>Přihlášení</h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: UI.textMid, margin: '0 0 20px' }}>Interní provozní rozhraní pro zpracování zakázek a práci s kapacitou malířů.</p>
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

function App() {
  const [session, setSession] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [painters, setPainters] = useState([])
  const [calendar, setCalendar] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(monthStart(new Date().toISOString().slice(0, 10)))
  const [calendarDate, setCalendarDate] = useState('')
  const [calendarBusy, setCalendarBusy] = useState(false)
  const [form, setForm] = useState({ reason: '', confirmedPrice: '', painterPayout: '', painterId: '' })
  const [busyAction, setBusyAction] = useState('')
  const [message, setMessage] = useState('')
  const [openSidePanel, setOpenSidePanel] = useState('recommended')
  const [expandedPainterId, setExpandedPainterId] = useState('')
  const [copied, setCopied] = useState(false)

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
        confirmedPrice: data.job.confirmed_client_price || data.job.estimated_client_price_max || '',
        painterPayout: data.job.painter_reward || '',
      }))
      if (data.job.preferred_date) {
        setCalendarMonth(monthStart(data.job.preferred_date))
        setCalendarDate(data.job.preferred_date)
      }
    }
  }

  async function fetchCalendar(jobId, date = calendarDate, month = calendarMonth) {
    if (!session) return
    setCalendarBusy(true)
    const query = new URLSearchParams({
      from: month,
      months: '1',
      ...(jobId ? { jobId } : {}),
      ...(date ? { date } : {}),
    })
    const res = await fetch(`/api/admin/availability?${query.toString()}`)
    const data = await res.json()
    setCalendarBusy(false)
    if (res.ok) {
      setCalendar(data)
      if (data.selected_date) setCalendarDate(data.selected_date)
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (!session) return
    const id = setInterval(fetchJobs, 30000)
    return () => clearInterval(id)
  }, [session])

  useEffect(() => {
    if (session && selectedId) fetchDetail(selectedId)
  }, [session, selectedId])

  useEffect(() => {
    if (session) fetchCalendar(selectedId, calendarDate, calendarMonth)
  }, [session, selectedId, calendarMonth])

  const orderedJobs = useMemo(() => [...jobs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)), [jobs])

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
    setMessage(action === 'send_offer' && data.result.offerUrl ? `Nabidka pripravena: ${data.result.offerUrl}` : 'Uloženo.')
    await Promise.all([fetchJobs(), fetchDetail(selectedJob.id), fetchCalendar(selectedJob.id, calendarDate, calendarMonth)])
  }

  async function updatePainterDay(painter, patch) {
    if (!calendarDate) return
    setCalendarBusy(true)
    setMessage('')
    const res = await fetch('/api/admin/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        painterId: painter.id,
        jobId: selectedJob?.id || null,
        from: calendarMonth,
        months: 1,
        date: calendarDate,
        entries: [{
          date: calendarDate,
          status: patch.status ?? painter.availability_status,
          capacity: patch.capacity ?? painter.capacity,
          accepts_express: patch.accepts_express ?? painter.accepts_express,
          note: patch.note ?? painter.note,
        }],
      }),
    })
    const data = await res.json()
    setCalendarBusy(false)
    if (!res.ok) {
      setMessage(data.error || 'Dostupnost se nepodařilo uložit.')
      return
    }
    setCalendar(data)
    setMessage('Dostupnost malíře uložena.')
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setSession(null)
    setSelectedId(null)
    setDetail(null)
    setCalendar(null)
    setJobs([])
  }

  if (loading && !session) return <Login onLogin={login} loading={loading} error={loginError} />
  if (!session) return <Login onLogin={login} loading={loading} error={loginError} />

  return (
    <div style={{ minHeight: '100vh', background: UI.bg, padding: 20 }}>
      <div style={{ maxWidth: 1460, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Malíř Hned / Dispečink</div>
            <h1 style={{ fontSize: 34, fontWeight: 400, color: UI.text, letterSpacing: '-0.06em', margin: '6px 0 0' }}>Fronta zakázek</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: UI.textMid }}>{session.email}</span>
            <button style={ghostButton()} onClick={logout}>Odhlásit</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>
          <div style={{ background: UI.surface, borderRadius: 24, border: `1px solid ${UI.border}`, boxShadow: UI.shadow, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${UI.border}`, fontSize: 13, color: UI.textMid }}>
              {orderedJobs.length} zakázek ve frontě
            </div>
            <div style={{ maxHeight: '78vh', overflow: 'auto' }}>
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
                    padding: 16,
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
                    <strong style={{ color: UI.text, fontSize: 15 }}>{job.reference}</strong>
                    <span style={{ fontSize: 12, color: UI.textMid }}>{waitLabel(job.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 14, color: UI.text, marginBottom: 5 }}>{job.locality || job.service_area || 'Bez lokality'} · {job.space_type || job.work_type || 'Zakázka'}</div>
                  <div style={{ fontSize: 13, color: UI.textMid, lineHeight: 1.45 }}>{job.preferred_date_label || 'Bez termínu'} · {job.preferred_time_label || 'Čas neurčen'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8, fontSize: 12, color: UI.textMid }}>
                    <span>{jobStatusLabel(job.status)}</span>
                    <span>{money(job.estimated_price_high)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: UI.surface, borderRadius: 24, border: `1px solid ${UI.border}`, boxShadow: UI.shadow, minHeight: 600 }}>
            {!selectedJob ? (
              <div style={{ padding: 28, color: UI.textMid }}>Vyberte zakazku.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
                <div style={{ padding: 20, borderBottom: `1px solid ${UI.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{selectedJob.reference}</div>
                      <h2 style={{ fontSize: 28, fontWeight: 400, color: UI.text, letterSpacing: '-0.05em', margin: '6px 0 6px' }}>{selectedJob.client_name || 'Klient bez jména'}</h2>
                      <div style={{ fontSize: 14, color: UI.textMid, lineHeight: 1.6 }}>{selectedJob.client_address || 'Adresa bude doplněna'}</div>
                    </div>
                    <div style={{ fontSize: 13, color: UI.textMid }}>
                      <div>Stav: <strong style={{ color: UI.text }}>{jobStatusLabel(selectedJob.status)}</strong></div>
                      <div>Čeká: {waitLabel(selectedJob.created_at)}</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 16, overflow: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 16, alignItems: 'start' }}>
                    <div style={{ display: 'grid', gap: 12 }}>
                      <Panel title="Zadání klienta">
                        <KV label="Kontakt" value={`${selectedJob.client_phone || '—'} · ${selectedJob.client_email || '—'}`} />
                        <KV label="Preferovaný termín" value={`${selectedJob.preferred_date_label || '—'} · ${selectedJob.preferred_time_label || '—'}`} />
                        <KV label="Typ práce" value={`${selectedJob.work_type || '—'} · ${selectedJob.repairs || '—'}`} />
                        <KV label="Rozsah" value={`${selectedJob.custom_area || '—'} m2 · ${selectedJob.property_type || '—'}`} />
                        <KV label="Poznámka" value={selectedJob.booking_note || selectedJob.client_note || 'Bez poznámky'} />
                      </Panel>

                      <Panel title="Zpracování">
                        <div style={{ display: 'grid', gap: 10 }}>
                          <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Důvod pro doplnění údajů" style={{ ...inputStyle(), minHeight: 78, resize: 'vertical' }} />
                          <button style={ghostButton()} disabled={busyAction === 'request_completion'} onClick={() => doAction('request_completion', { reason: form.reason })}>Vyžádat doplnění</button>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <input value={form.confirmedPrice} onChange={(e) => setForm({ ...form, confirmedPrice: e.target.value })} placeholder="Potvrzená cena klientovi" style={inputStyle()} />
                            <input value={form.painterPayout} onChange={(e) => setForm({ ...form, painterPayout: e.target.value })} placeholder="Odměna malíři" style={inputStyle()} />
                          </div>
                          <button style={primaryButton()} disabled={busyAction === 'prepare_job'} onClick={() => doAction('prepare_job', { confirmedPrice: form.confirmedPrice, painterPayout: form.painterPayout })}>Připravit k nabídnutí</button>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                            <select value={form.painterId} onChange={(e) => setForm({ ...form, painterId: e.target.value })} style={inputStyle()}>
                              <option value="">Vyberte malíře</option>
                              {(calendar?.selected_day?.painters?.length ? calendar.selected_day.painters : detail?.recommendedPainters?.length ? detail.recommendedPainters : painters).map((painter) => (
                                <option key={painter.id} value={painter.id}>{painter.name} · {painter.display_status || painter.role}</option>
                              ))}
                            </select>
                            <button style={primaryButton()} disabled={!form.painterId || busyAction === 'send_offer'} onClick={() => doAction('send_offer', { painterId: form.painterId })}>Poslat nabídku</button>
                          </div>

                          {(() => {
                            const status = selectedJob.status
                            const showConfirm = status === 'painter_accepted'
                            const showReturnDispatch = ['painter_accepted', 'offered_to_painter', 'confirmed_to_client'].includes(status)
                            const showInProgress = status === 'confirmed_to_client'
                            const showDone = status === 'in_progress'
                            const showCancel = !['completed', 'cancelled'].includes(status)
                            return (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {showConfirm ? <button style={ghostButton()} disabled={busyAction === 'confirm_assignment'} onClick={() => doAction('confirm_assignment')}>Finálně potvrdit</button> : null}
                                {showReturnDispatch ? <button style={ghostButton()} disabled={busyAction === 'return_to_dispatch'} onClick={() => doAction('return_to_dispatch')}>Vrátit do dispečinku</button> : null}
                                {showInProgress ? <button style={ghostButton()} disabled={busyAction === 'mark_in_progress'} onClick={() => doAction('mark_in_progress')}>V řešení</button> : null}
                                {showDone ? <button style={ghostButton()} disabled={busyAction === 'mark_done'} onClick={() => doAction('mark_done')}>Dokončeno</button> : null}
                                {showCancel ? <button style={{ ...ghostButton(), color: UI.danger, borderColor: 'rgba(181,77,67,0.28)' }} disabled={busyAction === 'cancel_job'} onClick={() => doAction('cancel_job')}>Zrušit</button> : null}
                              </div>
                            )
                          })()}
                          {message ? (
                            message.startsWith('Nabidka') ? (
                              <div style={{ fontSize: 13, color: UI.accent, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span>{message.split(': ')[0]}:</span>
                                <span style={{ wordBreak: 'break-all' }}>{message.split(': ')[1]}</span>
                                <button
                                  style={ghostButton()}
                                  onClick={() => {
                                    navigator.clipboard.writeText(message.split(': ')[1])
                                    setCopied(true)
                                    setTimeout(() => setCopied(false), 2000)
                                  }}
                                >
                                  {copied ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,7 5,10 11,3"/></svg>Zkopírováno</span> : 'Kopírovat odkaz'}
                                </button>
                              </div>
                            ) : (
                              <div style={{ fontSize: 13, color: message.includes('uložena') || message === 'Uloženo.' ? UI.accent : UI.textMid }}>{message}</div>
                            )
                          ) : null}
                        </div>
                      </Panel>

                      <Panel title="Kalendář kapacity týmu">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 14, color: UI.text }}>{selectedJob.preferred_date_label || 'Vyberte den v kalendáři'}</div>
                            <div style={{ fontSize: 12, color: UI.textMid }}>Jeden měsíc, přepínání šipkami.</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button type="button" onClick={() => setCalendarMonth((prev) => addMonths(prev, -1))} style={iconButton()}>‹</button>
                            <button type="button" onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))} style={iconButton()}>›</button>
                          </div>
                        </div>

                        {(calendar?.months || []).map((month) => (
                          <div key={month.key} style={{ border: `1px solid ${UI.border}`, borderRadius: 18, padding: 12, background: UI.surfaceSoft, marginBottom: 12 }}>
                            <div style={{ fontSize: 15, color: UI.text, marginBottom: 10, textTransform: 'capitalize' }}>{month.label}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 8 }}>
                              {WEEKDAYS.map((item) => <div key={item} style={{ textAlign: 'center', fontSize: 11, color: UI.textLight }}>{item}</div>)}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
                              {Array.from({ length: month.leading }).map((_, idx) => <div key={`${month.key}-lead-${idx}`} />)}
                              {month.cal.map((day) => {
                                const active = calendarDate === day.date
                                const tone = day.available_slots >= 3 ? UI.accentSoft : day.available_slots >= 1 ? UI.warnSoft : UI.mutedSoft
                                return (
                                  <button
                                    key={day.date}
                                    type="button"
                                    onClick={() => {
                                      setCalendarDate(day.date)
                                      fetchCalendar(selectedId, day.date, calendarMonth)
                                    }}
                                    style={{
                                      minHeight: 62,
                                      borderRadius: 12,
                                      border: `1px solid ${active ? UI.text : UI.border}`,
                                      background: tone,
                                      textAlign: 'left',
                                      padding: '6px 7px',
                                      cursor: 'pointer',
                                      fontFamily: "'Outfit', sans-serif",
                                    }}
                                  >
                                    <div style={{ fontSize: 13, color: UI.text, marginBottom: 3 }}>{day.d}</div>
                                    <div style={{ fontSize: 10, color: UI.textMid, lineHeight: 1.3 }}>{day.available_count} volno</div>
                                    <div style={{ fontSize: 10, color: UI.textLight, lineHeight: 1.3 }}>{day.blocked_count} blok.</div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}

                        <div style={{ border: `1px solid ${UI.border}`, borderRadius: 18, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detail dne</div>
                              <div style={{ fontSize: 18, color: UI.text, letterSpacing: '-0.04em', marginTop: 4 }}>{dayLabel(calendar?.selected_day?.date || calendarDate)}</div>
                            </div>
                            {calendarBusy ? <div style={{ fontSize: 12, color: UI.textMid }}>Načítám…</div> : null}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            <Tag label={`${calendar?.selected_day?.available_count || 0} dostupní`} tone="good" />
                            <Tag label={`${calendar?.selected_day?.limited_count || 0} omezení`} tone="warn" />
                            <Tag label={`${calendar?.selected_day?.blocked_count || 0} blokace`} tone="muted" />
                            <Tag label={`${calendar?.selected_day?.available_slots || 0} volna kapacita`} tone="light" />
                          </div>

                          {(calendar?.selected_day?.painters || []).length ? (
                            <div style={{ display: 'grid', gap: 8 }}>
                              {calendar.selected_day.painters.map((painter) => {
                                const meta = STATUS_META[painter.availability_status] || STATUS_META.available
                                const expanded = expandedPainterId === painter.id
                                return (
                                  <div key={painter.id} style={{ border: `1px solid ${UI.border}`, borderRadius: 16, padding: 10 }}>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedPainterId((prev) => prev === painter.id ? '' : painter.id)}
                                      style={{ width: '100%', border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div>
                                          <strong style={{ fontSize: 14, color: UI.text }}>{painter.name}</strong>
                                          <div style={{ fontSize: 12, color: UI.textMid, marginTop: 3 }}>{painter.service_areas?.join(', ') || 'Bez lokality'}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                          <Tag label={`Kap. ${painter.remaining_capacity}`} tone="light" />
                                          <span style={{ padding: '6px 10px', borderRadius: 999, background: meta.bg, color: meta.text, fontSize: 12 }}>{painter.display_status}</span>
                                        </div>
                                      </div>
                                    </button>

                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                      {painter.accepts_express ? <Tag label="Bere expres" tone="good" /> : null}
                                      {painter.job_fit?.locality_match ? <Tag label="Sedí lokalita" tone="good" /> : <Tag label="Mimo lokalitu" tone="muted" />}
                                      {painter.job_fit?.work_type_match ? <Tag label="Sedí typ práce" tone="good" /> : null}
                                      {painter.block_count ? <Tag label={`${painter.block_count} blokace`} tone="warn" /> : null}
                                    </div>

                                    {expanded ? (
                                      <>
                                        {painter.note || painter.painter_note ? (
                                          <div style={{ fontSize: 12, color: UI.textMid, marginTop: 10, lineHeight: 1.5 }}>
                                            {painter.note || painter.painter_note}
                                          </div>
                                        ) : null}

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 12 }}>
                                          {['available', 'limited', 'unavailable'].map((value) => (
                                            <button
                                              key={value}
                                              type="button"
                                              onClick={() => updatePainterDay(painter, { status: value })}
                                              style={{
                                                padding: '9px 8px',
                                                borderRadius: 12,
                                                border: `1px solid ${painter.availability_status === value ? UI.text : UI.border}`,
                                                background: painter.availability_status === value ? STATUS_META[value].bg : '#fff',
                                                color: painter.availability_status === value ? STATUS_META[value].text : UI.textMid,
                                                fontFamily: "'Outfit', sans-serif",
                                                fontSize: 12,
                                                cursor: 'pointer',
                                              }}
                                            >
                                              {availabilityLabel(value)}
                                            </button>
                                          ))}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr auto', gap: 8, marginTop: 8 }}>
                                          <input type="number" min="0" defaultValue={painter.capacity} onBlur={(e) => updatePainterDay(painter, { capacity: e.target.value })} style={inputStyle()} />
                                          <input defaultValue={painter.note || ''} onBlur={(e) => updatePainterDay(painter, { note: e.target.value })} placeholder="Poznámka k tomuto dni" style={inputStyle()} />
                                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: UI.textMid }}>
                                            <input type="checkbox" defaultChecked={Boolean(painter.accepts_express)} onChange={(e) => updatePainterDay(painter, { accepts_express: e.target.checked })} />
                                            Expres
                                          </label>
                                        </div>
                                      </>
                                    ) : null}

                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                                      <button style={ghostButton()} onClick={() => { setForm((prev) => ({ ...prev, painterId: painter.id })); setExpandedPainterId(painter.id) }}>Vybrat do nabídky</button>
                                      {painter.portal_url ? <a href={painter.portal_url} style={{ ...ghostButton(), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Kalendář malíře</a> : null}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : <div style={{ color: UI.textMid, fontSize: 13 }}>Pro tento den zatím nemáme detail dostupnosti.</div>}
                        </div>
                      </Panel>
                    </div>

                    <div style={{ display: 'grid', gap: 10, alignSelf: 'start', position: 'sticky', top: 12 }}>
                      <AccordionPanel
                        title="Nabídky malířům"
                        subtitle={(detail?.offers || []).length ? `${detail.offers.length} záznamů` : 'Zatím bez nabídek.'}
                        open={openSidePanel === 'offers'}
                        onToggle={() => setOpenSidePanel((prev) => prev === 'offers' ? '' : 'offers')}
                      >
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
                      </AccordionPanel>

                      <AccordionPanel
                        title="Vhodní malíři"
                        subtitle={(detail?.recommendedPainters || []).length ? `${detail.recommendedPainters.length} doporučení` : 'Bez doporučení'}
                        open={openSidePanel === 'recommended'}
                        onToggle={() => setOpenSidePanel((prev) => prev === 'recommended' ? '' : 'recommended')}
                      >
                        {(detail?.recommendedPainters || []).length ? detail.recommendedPainters.map((painter) => (
                          <div key={painter.id} style={{ padding: '12px 0', borderBottom: `1px solid ${UI.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                              <strong style={{ fontSize: 14, color: UI.text }}>{painter.name}</strong>
                              <span style={{ fontSize: 12, color: UI.textMid }}>{availabilityLabel(painter.availability_status)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: UI.textMid, marginTop: 4 }}>{painter.display_status}</div>
                            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button style={ghostButton()} onClick={() => setForm((prev) => ({ ...prev, painterId: painter.id }))}>Vybrat do nabídky</button>
                              {painter.portal_url ? <a href={painter.portal_url} style={{ ...ghostButton(), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Kalendář malíře</a> : null}
                            </div>
                          </div>
                        )) : <div style={{ color: UI.textMid, fontSize: 13 }}>Doporučení se objeví po zadání preferovaného dne.</div>}
                      </AccordionPanel>

                      <AccordionPanel
                        title="Historie"
                        subtitle={(detail?.events || []).length ? `${detail.events.length} událostí` : 'Historie je zatím prázdná.'}
                        open={openSidePanel === 'history'}
                        onToggle={() => setOpenSidePanel((prev) => prev === 'history' ? '' : 'history')}
                      >
                        {(detail?.events || []).length ? detail.events.map((event) => (
                          <div key={event.id} style={{ padding: '10px 0', borderBottom: `1px solid ${UI.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 13, color: UI.text }}>{event.event_type}</span>
                              <span style={{ fontSize: 12, color: UI.textMid }}>{dt(event.created_at)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: UI.textMid, marginTop: 4 }}>{event.actor_label}</div>
                          </div>
                        )) : <div style={{ color: UI.textMid, fontSize: 13 }}>Historie je zatím prázdná.</div>}
                      </AccordionPanel>
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

function iconButton() {
  return {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: `1px solid ${UI.border}`,
    background: '#fff',
    color: UI.text,
    cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
    fontSize: 20,
    lineHeight: 1,
  }
}

function Tag({ label, tone = 'light' }) {
  const tones = {
    good: { bg: UI.accentSoft, color: UI.accent },
    warn: { bg: UI.warnSoft, color: UI.warn },
    muted: { bg: UI.mutedSoft, color: UI.muted },
    light: { bg: UI.surfaceSoft, color: UI.textMid },
  }
  const meta = tones[tone] || tones.light
  return <span style={{ padding: '6px 10px', borderRadius: 999, background: meta.bg, color: meta.color, fontSize: 12 }}>{label}</span>
}

function Panel({ title, children }) {
  return (
    <div style={{ border: `1px solid ${UI.border}`, borderRadius: 20, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function AccordionPanel({ title, subtitle, open, onToggle, children }) {
  return (
    <div style={{ border: `1px solid ${UI.border}`, borderRadius: 18, background: '#fff', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{ width: '100%', padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</div>
          <div style={{ fontSize: 12, color: UI.textMid, marginTop: 4 }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 18, color: UI.textMid }}>{open ? '−' : '+'}</div>
      </button>
      {open ? <div style={{ padding: '0 16px 14px' }}>{children}</div> : null}
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
