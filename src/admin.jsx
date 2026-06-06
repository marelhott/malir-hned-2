const { useEffect, useMemo, useState, useCallback } = React

const C = {
  bg: '#f0ece6',
  surface: '#ffffff',
  soft: '#f7f3ee',
  border: 'rgba(175,165,148,0.28)',
  borderStrong: 'rgba(175,165,148,0.55)',
  text: '#18170f',
  mid: '#7a7268',
  light: '#b8b0a4',
  accent: '#2a7a4e',
  accentSoft: '#e6f3ec',
  warn: '#b89236',
  warnSoft: '#f7eed8',
  danger: '#b54d43',
  dangerSoft: '#faeae9',
  muted: '#8b8173',
  mutedSoft: '#efe9e0',
  shadow: '0 1px 3px rgba(20,14,6,0.06), 0 8px 32px rgba(20,14,6,0.08)',
  shadowHeavy: '0 2px 8px rgba(20,14,6,0.06), 0 24px 64px rgba(20,14,6,0.14)',
}

const STATUS = {
  waiting_for_review:       { label: 'Čeká na kontrolu', color: C.warn, bg: C.warnSoft },
  waiting_for_client_details: { label: 'Čeká na klienta', color: C.muted, bg: C.mutedSoft },
  ready_to_offer:           { label: 'Připravena', color: C.accent, bg: C.accentSoft },
  offered_to_painter:       { label: 'Nabídnuto', color: C.warn, bg: C.warnSoft },
  painter_accepted:         { label: 'Malíř přijal', color: C.accent, bg: C.accentSoft },
  confirmed_to_client:      { label: 'Potvrzeno', color: C.accent, bg: C.accentSoft },
  in_progress:              { label: 'V realizaci', color: C.accent, bg: C.accentSoft },
  completed:                { label: 'Dokončeno', color: C.muted, bg: C.mutedSoft },
  cancelled:                { label: 'Zrušeno', color: C.danger, bg: C.dangerSoft },
}

const AVAIL = {
  available:   { label: 'Dostupný',  color: C.accent, bg: C.accentSoft },
  limited:     { label: 'Omezený',   color: C.warn,   bg: C.warnSoft },
  unavailable: { label: 'Nepřijede', color: C.danger, bg: C.dangerSoft },
}

function fmt(v) {
  if (!Number.isFinite(Number(v))) return '—'
  return new Intl.NumberFormat('cs-CZ').format(Number(v)) + ' Kč'
}
function fmtDate(v) {
  if (!v) return '—'
  return new Intl.DateTimeFormat('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(v + 'T12:00:00Z'))
}
function fmtDateLong(v) {
  if (!v) return '—'
  return new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(v + 'T12:00:00Z'))
}
function fmtDt(v) {
  if (!v) return '—'
  return new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(v))
}
function ago(v) {
  const m = Math.round(Math.max(0, Date.now() - new Date(v)) / 60000)
  if (m < 1) return 'právě teď'
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} h ${m % 60} min`
}
function isoDate(d) { return d.toISOString().slice(0, 10) }
function addDays(date, n) {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return isoDate(d)
}
function weekDates(date) {
  const d = new Date(date + 'T12:00:00Z')
  const dow = (d.getUTCDay() + 6) % 7
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d)
    x.setUTCDate(d.getUTCDate() - dow + i)
    return isoDate(x)
  })
}

// ── SHARED STYLES ─────────────────────────────────────────────
const btn = (bg, color = '#fff', border = 'transparent') => ({
  padding: '9px 16px', borderRadius: 12, border: `1px solid ${border}`,
  background: bg, color, fontSize: 13, fontWeight: 400,
  cursor: 'pointer', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap',
})
const ghostBtn = () => btn(C.surface, C.mid, C.border)
const primaryBtn = () => btn(C.accent)
const dangerBtn = () => btn(C.dangerSoft, C.danger, 'rgba(181,77,67,0.25)')
const inp = () => ({
  width: '100%', padding: '10px 12px', borderRadius: 12,
  border: `1px solid ${C.border}`, fontSize: 13,
  fontFamily: "'Outfit', sans-serif", outline: 'none', boxSizing: 'border-box',
  background: C.surface,
})

function Pill({ label, color, bg }) {
  return <span style={{ padding: '3px 9px', borderRadius: 99, background: bg, color, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
}

// ── LOGIN ─────────────────────────────────────────────────────
function Login({ onLogin, loading, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, boxShadow: C.shadowHeavy, padding: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Admin / Dispečink</div>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: C.text, letterSpacing: '-0.05em', margin: '0 0 20px' }}>Přihlášení</h1>
        <div style={{ display: 'grid', gap: 10 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail admina" style={inp()} />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Heslo" style={inp()} onKeyDown={e => e.key === 'Enter' && onLogin({ email, password })} />
          {error && <div style={{ fontSize: 13, color: C.danger }}>{error}</div>}
          <button onClick={() => onLogin({ email, password })} disabled={loading} style={primaryBtn()}>{loading ? 'Přihlašuji…' : 'Přihlásit'}</button>
        </div>
      </div>
    </div>
  )
}

// ── JOB CARD ─────────────────────────────────────────────────
function JobCard({ job, active, onClick }) {
  const s = STATUS[job.status] || { label: job.status, color: C.mid, bg: C.soft }
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', border: 'none', borderBottom: `1px solid ${C.border}`,
      background: active ? C.accentSoft : C.surface, padding: '14px 16px',
      cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'background 0.1s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 11, color: C.light, fontWeight: 500 }}>{job.reference} · {ago(job.created_at)}</span>
          <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginTop: 2 }}>{job.client_name || 'Klient'}</div>
        </div>
        <Pill label={s.label} color={s.color} bg={s.bg} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 12, color: C.mid }}>{job.locality || '—'} · {fmtDate(job.preferred_date) || '—'}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{fmt(job.estimated_client_price_max || job.estimated_price_high)}</div>
      </div>
    </button>
  )
}

// ── JOB DETAIL MODAL ──────────────────────────────────────────
function JobDetailModal({ jobId, painters, onClose, onRefreshJobs }) {
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ reason: '', confirmedPrice: '', painterPayout: '', painterId: '' })
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!jobId) return
    fetch(`/api/admin/job?id=${encodeURIComponent(jobId)}`)
      .then(r => r.json()).then(d => {
        setDetail(d)
        setForm(f => ({
          ...f,
          confirmedPrice: d.job.confirmed_client_price || d.job.estimated_client_price_max || '',
          painterPayout: d.job.painter_reward || '',
        }))
      })
  }, [jobId])

  async function act(action, extra = {}) {
    setBusy(action); setMsg('')
    const r = await fetch('/api/admin/job-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId, action, ...extra }) })
    const d = await r.json()
    setBusy('')
    if (!r.ok) { setMsg(d.error || 'Akce se nepodařila.'); return }
    if (action === 'send_offer' && d.result?.offerUrl) setMsg('offer:' + d.result.offerUrl)
    else setMsg('ok')
    const updated = await fetch(`/api/admin/job?id=${encodeURIComponent(jobId)}`).then(x => x.json())
    setDetail(updated)
    onRefreshJobs()
  }

  const job = detail?.job
  const recPainters = detail?.recommendedPainters || []
  const s = job ? (STATUS[job.status] || { label: job.status, color: C.mid, bg: C.soft }) : null

  const primaryAction = job ? {
    waiting_for_review: null,
    ready_to_offer: { label: 'Poslat nabídku malíři', action: 'send_offer', extra: () => ({ painterId: form.painterId }), disabled: !form.painterId },
    painter_accepted: { label: 'Potvrdit přiřazení', action: 'confirm_assignment' },
    confirmed_to_client: { label: 'Označit jako v realizaci', action: 'mark_in_progress' },
    in_progress: { label: 'Označit jako dokončeno', action: 'mark_done' },
  }[job.status] : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,23,15,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 680, margin: '0 auto', maxHeight: '92vh', background: C.surface, borderRadius: '24px 24px 0 0', boxShadow: C.shadowHeavy, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Handle */}
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border }} />
        </div>

        {!job ? (
          <div style={{ padding: 32, color: C.mid, textAlign: 'center' }}>Načítám…</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '12px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.light, fontWeight: 500, marginBottom: 4 }}>{job.reference} · přijato {ago(job.created_at)}</div>
                  <div style={{ fontSize: 22, fontWeight: 500, color: C.text, letterSpacing: '-0.04em', lineHeight: 1.2 }}>{job.client_name || 'Klient'}</div>
                  <div style={{ fontSize: 13, color: C.mid, marginTop: 4 }}>{job.client_address || job.locality || '—'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Pill label={s.label} color={s.color} bg={s.bg} />
                  <button onClick={onClose} style={{ ...ghostBtn(), padding: '6px 10px', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              </div>
            </div>

            {/* Body scroll */}
            <div style={{ overflow: 'auto', flex: 1, padding: '16px 20px' }}>
              {/* Key facts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  ['Termín', fmtDate(job.preferred_date)],
                  ['Cena klientovi', fmt(job.confirmed_client_price || job.estimated_client_price_max)],
                  ['Odměna malíři', fmt(job.painter_reward)],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: C.soft, borderRadius: 14, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: C.text }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Contact + job info */}
              <div style={{ background: C.soft, borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
                  {[
                    ['Telefon', job.client_phone],
                    ['E-mail', job.client_email],
                    ['Typ práce', job.work_type],
                    ['Plocha', job.custom_area ? job.custom_area + ' m²' : '—'],
                    ['Opravy', job.repairs],
                    ['Lokalita', job.locality || job.service_area],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</div>
                      <div style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{v || '—'}</div>
                    </div>
                  ))}
                </div>
                {job.booking_note && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, fontSize: 13, color: C.mid }}>{job.booking_note}</div>}
              </div>

              {/* Actions by status */}
              {job.status === 'waiting_for_review' && (
                <Section title="Zpracování">
                  <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Důvod pro doplnění (nepovinné)" style={{ ...inp(), minHeight: 64, resize: 'vertical' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                    <input value={form.confirmedPrice} onChange={e => setForm({ ...form, confirmedPrice: e.target.value })} placeholder="Cena klientovi (Kč)" style={inp()} />
                    <input value={form.painterPayout} onChange={e => setForm({ ...form, painterPayout: e.target.value })} placeholder="Odměna malíři (Kč)" style={inp()} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <button style={ghostBtn()} disabled={busy === 'request_completion'} onClick={() => act('request_completion', { reason: form.reason })}>Vyžádat doplnění</button>
                    <button style={primaryBtn()} disabled={busy === 'prepare_job'} onClick={() => act('prepare_job', { confirmedPrice: form.confirmedPrice, painterPayout: form.painterPayout })}>Připravit k nabídnutí →</button>
                  </div>
                </Section>
              )}

              {(job.status === 'ready_to_offer' || job.status === 'offered_to_painter') && (
                <Section title="Přiřadit malíře">
                  {recPainters.length > 0 && (
                    <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                      {recPainters.map(p => {
                        const av = AVAIL[p.availability_status] || AVAIL.available
                        return (
                          <button key={p.id} onClick={() => setForm(f => ({ ...f, painterId: p.id }))} style={{
                            textAlign: 'left', padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                            border: `1.5px solid ${form.painterId === p.id ? C.accent : C.border}`,
                            background: form.painterId === p.id ? C.accentSoft : C.surface,
                            fontFamily: "'Outfit', sans-serif",
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{p.name}</span>
                              <Pill label={av.label} color={av.color} bg={av.bg} />
                            </div>
                            <div style={{ fontSize: 12, color: C.mid, marginTop: 3 }}>{p.service_areas?.join(', ') || p.display_status}</div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {recPainters.length === 0 && (
                    <select value={form.painterId} onChange={e => setForm({ ...form, painterId: e.target.value })} style={{ ...inp(), marginBottom: 10 }}>
                      <option value="">Vyberte malíře</option>
                      {painters.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  <button style={{ ...primaryBtn(), width: '100%', padding: '12px' }} disabled={!form.painterId || busy === 'send_offer'} onClick={() => act('send_offer', { painterId: form.painterId })}>
                    {busy === 'send_offer' ? 'Odesílám…' : 'Odeslat nabídku malíři'}
                  </button>
                </Section>
              )}

              {/* Offer URL result */}
              {msg.startsWith('offer:') && (
                <div style={{ background: C.accentSoft, borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, fontSize: 12, color: C.accent, wordBreak: 'break-all' }}>{msg.slice(6)}</div>
                  <button style={ghostBtn()} onClick={() => { navigator.clipboard.writeText(msg.slice(6)); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                    {copied ? '✓ Zkopírováno' : 'Kopírovat odkaz'}
                  </button>
                </div>
              )}
              {msg === 'ok' && <div style={{ fontSize: 13, color: C.accent, marginBottom: 12 }}>Uloženo.</div>}
              {msg && !msg.startsWith('offer:') && msg !== 'ok' && <div style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>{msg}</div>}

              {/* Offers list */}
              {(detail?.offers || []).length > 0 && (
                <Section title={`Nabídky (${detail.offers.length})`}>
                  {detail.offers.map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}`, gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{o.painter_name}</div>
                        <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>{fmtDt(o.created_at)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Pill label={{ pending: 'Čeká', accepted: 'Přijata', declined: 'Odmítnuta', expired: 'Prošlá', withdrawn: 'Stažena' }[o.status] || o.status} color={o.status === 'accepted' ? C.accent : C.mid} bg={o.status === 'accepted' ? C.accentSoft : C.soft} />
                        {o.status === 'pending' && <button style={ghostBtn()} onClick={() => act('withdraw_offer', { offerId: o.id })}>Stáhnout</button>}
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* History */}
              {(detail?.events || []).length > 0 && (
                <Section title="Historie">
                  {detail.events.slice(0, 8).map(e => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 13, color: C.text }}>{e.event_type}</span>
                      <span style={{ fontSize: 11, color: C.light }}>{fmtDt(e.created_at)}</span>
                    </div>
                  ))}
                </Section>
              )}
            </div>

            {/* Footer actions */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', background: C.surface }}>
              {primaryAction && (
                <button style={{ ...primaryBtn(), flex: 1, padding: '12px' }}
                  disabled={busy === primaryAction.action || primaryAction.disabled}
                  onClick={() => act(primaryAction.action, primaryAction.extra?.() || {})}>
                  {busy === primaryAction.action ? 'Odesílám…' : primaryAction.label}
                </button>
              )}
              {job.status === 'painter_accepted' && (
                <button style={ghostBtn()} disabled={busy === 'return_to_dispatch'} onClick={() => act('return_to_dispatch')}>Vrátit do dispečinku</button>
              )}
              {!['completed', 'cancelled'].includes(job.status) && (
                <button style={dangerBtn()} disabled={busy === 'cancel_job'} onClick={() => act('cancel_job')}>Zrušit zakázku</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── TEAM CALENDAR ─────────────────────────────────────────────
function monthStart(dateStr) {
  return dateStr.slice(0, 7) + '-01'
}
function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + n)
  d.setUTCDate(1)
  return isoDate(d)
}
function calGrid(monthStr) {
  const first = new Date(monthStr + 'T12:00:00Z')
  const year = first.getUTCFullYear()
  const month = first.getUTCMonth()
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const leading = (first.getUTCDay() + 6) % 7
  return { days, leading, year, month }
}

const AVAIL_DOT = { available: '#2a7a4e', limited: '#b89236', unavailable: '#b54d43' }

function TeamCalendar({ painters }) {
  const today = isoDate(new Date())
  const [monthBase, setMonthBase] = useState(monthStart(today))
  const [selectedDate, setSelectedDate] = useState(today)
  const [monthData, setMonthData] = useState(null)
  const [dayData, setDayData] = useState(null)
  const [loadingMonth, setLoadingMonth] = useState(false)
  const [loadingDay, setLoadingDay] = useState(false)
  const [expandedId, setExpandedId] = useState('')
  const [busy, setBusy] = useState('')
  const [saved, setSaved] = useState('')

  // Fetch full month calendar (aggregate counts per day)
  useEffect(() => {
    setLoadingMonth(true)
    const q = new URLSearchParams({ from: monthBase, months: '1' })
    fetch(`/api/admin/availability?${q}`)
      .then(r => r.json()).then(d => { setMonthData(d); setLoadingMonth(false) })
      .catch(() => setLoadingMonth(false))
  }, [monthBase])

  // Fetch selected day detail (per-painter)
  useEffect(() => {
    if (!selectedDate) return
    setLoadingDay(true); setDayData(null); setExpandedId('')
    const q = new URLSearchParams({ from: monthStart(selectedDate), months: '1', date: selectedDate })
    fetch(`/api/admin/availability?${q}`)
      .then(r => r.json()).then(d => { setDayData(d); setLoadingDay(false) })
      .catch(() => setLoadingDay(false))
  }, [selectedDate])

  async function save(painter, patch) {
    setBusy(painter.id); setSaved('')
    const r = await fetch('/api/admin/availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        painterId: painter.id, jobId: null,
        from: monthStart(selectedDate), months: 1, date: selectedDate,
        entries: [{ date: selectedDate, status: patch.status ?? painter.availability_status, capacity: patch.capacity ?? painter.capacity, accepts_express: patch.accepts_express ?? painter.accepts_express, note: patch.note ?? painter.note }],
      }),
    })
    const d = await r.json(); setBusy('')
    if (!r.ok) return
    setDayData(d); setSaved(painter.id)
    // Refresh month aggregates
    fetch(`/api/admin/availability?${new URLSearchParams({ from: monthBase, months: '1' })}`).then(r => r.json()).then(setMonthData)
  }

  const grid = calGrid(monthBase)
  const calDays = monthData?.months?.[0]?.cal || []
  const calMap = {}
  calDays.forEach(d => { calMap[d.date] = d })

  const dayPainters = dayData?.selected_day?.painters || []
  const stats = dayData?.selected_day

  const monthLabel = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).format(new Date(monthBase + 'T12:00:00Z'))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 0, minHeight: 'calc(100vh - 100px)', alignItems: 'start' }}>
      {/* Left: monthly calendar */}
      <div style={{ padding: '16px 16px 32px', borderRight: `1px solid ${C.border}` }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: C.text, letterSpacing: '-0.03em', textTransform: 'capitalize' }}>{monthLabel}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setMonthBase(m => addMonths(m, -1))} style={{ ...ghostBtn(), padding: '6px 12px' }}>‹</button>
            <button onClick={() => { setMonthBase(monthStart(today)); setSelectedDate(today) }} style={{ ...ghostBtn(), fontSize: 12 }}>Dnes</button>
            <button onClick={() => setMonthBase(m => addMonths(m, 1))} style={{ ...ghostBtn(), padding: '6px 12px' }}>›</button>
          </div>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 6 }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: grid.leading }, (_, i) => <div key={`lead-${i}`} />)}
          {Array.from({ length: grid.days }, (_, i) => {
            const num = i + 1
            const dateStr = `${monthBase.slice(0, 7)}-${String(num).padStart(2, '0')}`
            const dayInfo = calMap[dateStr]
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            const isPast = dateStr < today

            // Build 6 painter dots from aggregate counts
            const avail = dayInfo?.available_count || 0
            const limited = dayInfo?.limited_count || 0
            const blocked = dayInfo?.blocked_count || 0
            const unknown = Math.max(0, painters.length - avail - limited - blocked)
            const dots = [
              ...Array(avail).fill(AVAIL_DOT.available),
              ...Array(limited).fill(AVAIL_DOT.limited),
              ...Array(blocked).fill(AVAIL_DOT.unavailable),
              ...Array(unknown).fill('#d4cdc5'),
            ].slice(0, painters.length)

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  padding: '8px 6px 10px',
                  borderRadius: 12,
                  border: `1.5px solid ${isSelected ? C.accent : isToday ? C.borderStrong : C.border}`,
                  background: isSelected ? C.accentSoft : isToday ? '#fff' : isPast ? C.soft : '#fff',
                  cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                  textAlign: 'center',
                  opacity: isPast ? 0.55 : 1,
                  minHeight: 72,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: isToday || isSelected ? 600 : 400, color: isSelected ? C.accent : isToday ? C.accent : C.text }}>{num}</span>
                {loadingMonth ? null : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', maxWidth: 48 }}>
                    {dots.map((color, di) => (
                      <div key={di} style={{ width: 7, height: 7, borderRadius: 99, background: color }} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          {[['#2a7a4e', 'Dostupný'], ['#b89236', 'Omezený'], ['#b54d43', 'Nepřijede'], ['#d4cdc5', 'Neznámo']].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 99, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: C.light }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: day detail */}
      <div style={{ position: 'sticky', top: 100, padding: '16px 14px', maxHeight: 'calc(100vh - 110px)', overflow: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: C.text, letterSpacing: '-0.03em', marginBottom: 4 }}>{fmtDateLong(selectedDate)}</div>
        {stats && (
          <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
            <Pill label={`${stats.available_count} dostupní`} color={C.accent} bg={C.accentSoft} />
            {stats.limited_count > 0 && <Pill label={`${stats.limited_count} omezení`} color={C.warn} bg={C.warnSoft} />}
            {stats.blocked_count > 0 && <Pill label={`${stats.blocked_count} nepřijedou`} color={C.danger} bg={C.dangerSoft} />}
          </div>
        )}

        {loadingDay && <div style={{ color: C.light, fontSize: 13, padding: '20px 0' }}>Načítám…</div>}

        {!loadingDay && (
          <div style={{ display: 'grid', gap: 6 }}>
            {(dayPainters.length ? dayPainters : painters.map(p => ({ ...p, availability_status: 'available' }))).map(painter => {
              const av = AVAIL[painter.availability_status] || AVAIL.available
              const exp = expandedId === painter.id
              return (
                <div key={painter.id} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                  <button type="button" onClick={() => setExpandedId(p => p === painter.id ? '' : painter.id)} style={{
                    width: '100%', border: 'none', background: 'transparent', padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif", textAlign: 'left',
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: 99, background: AVAIL_DOT[painter.availability_status] || '#d4cdc5', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{painter.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: C.mid }}>kap. {painter.remaining_capacity ?? painter.capacity ?? '—'}</span>
                      <Pill label={av.label} color={av.color} bg={av.bg} />
                      <span style={{ fontSize: 13, color: C.light }}>{exp ? '−' : '+'}</span>
                    </div>
                  </button>

                  {exp && (
                    <div style={{ padding: '0 12px 12px', borderTop: `1px solid ${C.border}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, margin: '10px 0' }}>
                        {['available', 'limited', 'unavailable'].map(s => {
                          const m = AVAIL[s]
                          const active = painter.availability_status === s
                          return (
                            <button key={s} disabled={busy === painter.id} onClick={() => save(painter, { status: s })} style={{
                              padding: '8px 4px', borderRadius: 10, fontFamily: "'Outfit', sans-serif", fontSize: 11,
                              border: `1.5px solid ${active ? m.color : C.border}`,
                              background: active ? m.bg : C.surface, color: active ? m.color : C.mid, cursor: 'pointer',
                            }}>{m.label}</button>
                          )
                        })}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 6 }}>
                        <input type="number" min="0" defaultValue={painter.capacity} onBlur={e => save(painter, { capacity: e.target.value })} style={inp()} placeholder="Kap." />
                        <input defaultValue={painter.note || ''} onBlur={e => save(painter, { note: e.target.value })} placeholder="Poznámka k tomuto dni" style={inp()} />
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, fontSize: 12, color: C.mid, cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked={Boolean(painter.accepts_express)} onChange={e => save(painter, { accepts_express: e.target.checked })} />
                        Bere expres
                      </label>
                      {painter.portal_url && <a href={painter.portal_url} target="_blank" style={{ ...ghostBtn(), display: 'inline-flex', marginTop: 8, textDecoration: 'none', fontSize: 11 }}>Portál malíře →</a>}
                      {saved === painter.id && busy === '' && <div style={{ fontSize: 11, color: C.accent, marginTop: 6 }}>Uloženo.</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── HELPERS ───────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

// ── APP ───────────────────────────────────────────────────────
function App() {
  const [session, setSession] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('queue')
  const [jobs, setJobs] = useState([])
  const [painters, setPainters] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    fetch('/api/admin/session').then(r => r.json()).then(d => {
      if (d.authenticated) {
        setSession(d.admin)
        Promise.all([
          fetch('/api/admin/jobs').then(r => r.json()).then(d => { if (d.jobs) setJobs(d.jobs) }),
          fetch('/api/admin/painters').then(r => r.json()).then(d => { if (d.painters) setPainters(d.painters) }),
        ]).then(() => setLoading(false))
      } else setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!session) return
    const id = setInterval(() => {
      fetch('/api/admin/jobs').then(r => r.json()).then(d => { if (d.jobs) setJobs(d.jobs) })
    }, 30000)
    return () => clearInterval(id)
  }, [session])

  const refreshJobs = useCallback(() => {
    fetch('/api/admin/jobs').then(r => r.json()).then(d => { if (d.jobs) setJobs(d.jobs) })
  }, [])

  async function login(payload) {
    setLoginError(''); setLoading(true)
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const d = await r.json()
    if (!r.ok) { setLoginError(d.error || 'Nepodařilo se přihlásit.'); setLoading(false); return }
    setSession({ email: d.email })
    await Promise.all([
      fetch('/api/admin/jobs').then(r => r.json()).then(d => { if (d.jobs) setJobs(d.jobs) }),
      fetch('/api/admin/painters').then(r => r.json()).then(d => { if (d.painters) setPainters(d.painters) }),
    ])
    setLoading(false)
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setSession(null); setJobs([]); setSelectedId(null)
  }

  if (loading && !session) return <Login onLogin={login} loading={loading} error={loginError} />
  if (!session) return <Login onLogin={login} loading={loading} error={loginError} />

  const pending = jobs.filter(j => !['completed', 'cancelled'].includes(j.status))
  const done = jobs.filter(j => ['completed', 'cancelled'].includes(j.status))

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Outfit', sans-serif" }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(240,236,230,0.92)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Malíř Hned · Dispečink</div>
          <button onClick={logout} style={{ ...ghostBtn(), fontSize: 12, padding: '6px 12px' }}>Odhlásit</button>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderTop: `1px solid ${C.border}` }}>
          {[['queue', `Fronta${pending.length ? ` (${pending.length})` : ''}`], ['team', 'Tým & kalendář']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '11px 0', border: 'none', background: 'transparent',
              color: tab === key ? C.accent : C.mid, fontFamily: "'Outfit', sans-serif",
              fontSize: 13, fontWeight: tab === key ? 500 : 300, cursor: 'pointer',
              borderBottom: `2px solid ${tab === key ? C.accent : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Queue tab */}
      {tab === 'queue' && (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {pending.length === 0 && done.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: C.light, fontSize: 14 }}>Žádné zakázky ve frontě.</div>
          )}
          {pending.length > 0 && (
            <div>
              <div style={{ padding: '10px 16px 4px', fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Aktivní ({pending.length})</div>
              {pending.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(j => (
                <JobCard key={j.id} job={j} active={selectedId === j.id} onClick={() => setSelectedId(j.id)} />
              ))}
            </div>
          )}
          {done.length > 0 && (
            <div>
              <div style={{ padding: '14px 16px 4px', fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Uzavřené ({done.length})</div>
              {done.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(j => (
                <JobCard key={j.id} job={j} active={selectedId === j.id} onClick={() => setSelectedId(j.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team tab */}
      {tab === 'team' && <TeamCalendar painters={painters} />}

      {/* Job detail modal */}
      {selectedId && (
        <JobDetailModal
          key={selectedId}
          jobId={selectedId}
          painters={painters}
          onClose={() => setSelectedId(null)}
          onRefreshJobs={refreshJobs}
        />
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
