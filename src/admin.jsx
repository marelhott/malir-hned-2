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
function TeamCalendar({ painters }) {
  const today = isoDate(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [weekBase, setWeekBase] = useState(today)
  const [dayData, setDayData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  const week = useMemo(() => weekDates(weekBase), [weekBase])

  useEffect(() => {
    setLoading(true); setDayData(null)
    const q = new URLSearchParams({ from: selectedDate.slice(0, 7) + '-01', months: '1', date: selectedDate })
    fetch(`/api/admin/availability?${q}`)
      .then(r => r.json()).then(d => { setDayData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedDate])

  async function save(painter, patch) {
    setBusy(painter.id); setMsg('')
    const r = await fetch('/api/admin/availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        painterId: painter.id, jobId: null,
        from: selectedDate.slice(0, 7) + '-01', months: 1, date: selectedDate,
        entries: [{ date: selectedDate, status: patch.status ?? painter.availability_status, capacity: patch.capacity ?? painter.capacity, accepts_express: patch.accepts_express ?? painter.accepts_express, note: patch.note ?? painter.note }],
      }),
    })
    const d = await r.json(); setBusy('')
    if (!r.ok) { setMsg(d.error || 'Nepodařilo se uložit.'); return }
    setDayData(d); setMsg('ok')
  }

  const dayPainters = dayData?.selected_day?.painters || []
  const stats = dayData?.selected_day

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Week strip */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button onClick={() => setWeekBase(w => addDays(w, -7))} style={{ ...ghostBtn(), padding: '6px 10px' }}>‹</button>
          <button onClick={() => { setWeekBase(today); setSelectedDate(today) }} style={{ ...ghostBtn(), fontSize: 12 }}>Dnes</button>
          <button onClick={() => setWeekBase(w => addDays(w, 7))} style={{ ...ghostBtn(), padding: '6px 10px' }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {week.map(d => {
            const isToday = d === today
            const isSelected = d === selectedDate
            const day = new Intl.DateTimeFormat('cs-CZ', { weekday: 'short' }).format(new Date(d + 'T12:00:00Z'))
            const num = new Date(d + 'T12:00:00Z').getUTCDate()
            return (
              <button key={d} onClick={() => setSelectedDate(d)} style={{
                padding: '8px 4px', borderRadius: 12, border: `1.5px solid ${isSelected ? C.accent : isToday ? C.borderStrong : C.border}`,
                background: isSelected ? C.accent : isToday ? C.soft : C.surface,
                color: isSelected ? '#fff' : isToday ? C.text : C.mid,
                fontFamily: "'Outfit', sans-serif", cursor: 'pointer', textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{day}</div>
                <div style={{ fontSize: 18, fontWeight: isSelected || isToday ? 500 : 300, lineHeight: 1.3 }}>{num}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Day header */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: C.text, letterSpacing: '-0.03em' }}>{fmtDateLong(selectedDate)}</div>
        {stats && (
          <div style={{ display: 'flex', gap: 6 }}>
            <Pill label={`${stats.available_count} dostupní`} color={C.accent} bg={C.accentSoft} />
            {stats.limited_count > 0 && <Pill label={`${stats.limited_count} omezení`} color={C.warn} bg={C.warnSoft} />}
            {stats.blocked_count > 0 && <Pill label={`${stats.blocked_count} blokováni`} color={C.muted} bg={C.mutedSoft} />}
          </div>
        )}
      </div>

      {loading && <div style={{ padding: 24, textAlign: 'center', color: C.light, fontSize: 13 }}>Načítám…</div>}

      {!loading && (
        <div style={{ padding: '8px 12px' }}>
          {(dayPainters.length ? dayPainters : painters.map(p => ({ ...p, availability_status: 'available', remaining_capacity: 2 }))).map(painter => {
            const av = AVAIL[painter.availability_status] || AVAIL.available
            const expanded = expandedId === painter.id
            return (
              <div key={painter.id} style={{ marginBottom: 6, background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <button type="button" onClick={() => setExpandedId(p => p === painter.id ? '' : painter.id)} style={{
                  width: '100%', border: 'none', background: 'transparent', padding: '12px 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  cursor: 'pointer', fontFamily: "'Outfit', sans-serif", textAlign: 'left',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 99, background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: av.color }}>{painter.name[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{painter.name}</div>
                      <div style={{ fontSize: 11, color: C.light, marginTop: 1 }}>{painter.service_areas?.join(', ') || 'Praha'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: C.mid }}>Kap. {painter.remaining_capacity ?? painter.capacity ?? '?'}</span>
                    <Pill label={av.label} color={av.color} bg={av.bg} />
                    <span style={{ fontSize: 14, color: C.light }}>{expanded ? '−' : '+'}</span>
                  </div>
                </button>

                {expanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, margin: '12px 0' }}>
                      {['available', 'limited', 'unavailable'].map(s => {
                        const m = AVAIL[s]
                        const active = painter.availability_status === s
                        return (
                          <button key={s} disabled={busy === painter.id} onClick={() => save(painter, { status: s })} style={{
                            padding: '9px 8px', borderRadius: 12, fontFamily: "'Outfit', sans-serif", fontSize: 12,
                            border: `1.5px solid ${active ? m.color : C.border}`,
                            background: active ? m.bg : C.surface, color: active ? m.color : C.mid, cursor: 'pointer',
                          }}>{m.label}</button>
                        )
                      })}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                      <input type="number" min="0" defaultValue={painter.capacity} onBlur={e => save(painter, { capacity: e.target.value })} style={inp()} placeholder="Kap." />
                      <input defaultValue={painter.note || ''} onBlur={e => save(painter, { note: e.target.value })} placeholder="Poznámka k tomuto dni" style={inp()} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12, color: C.mid, cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={Boolean(painter.accepts_express)} onChange={e => save(painter, { accepts_express: e.target.checked })} />
                      Bere expres zakázky
                    </label>
                    {painter.portal_url && (
                      <a href={painter.portal_url} target="_blank" style={{ ...ghostBtn(), display: 'inline-flex', marginTop: 10, textDecoration: 'none', fontSize: 12 }}>
                        Otevřít portál malíře →
                      </a>
                    )}
                    {msg === 'ok' && busy === '' && <div style={{ fontSize: 12, color: C.accent, marginTop: 8 }}>Uloženo.</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
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
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Outfit', sans-serif", maxWidth: 680, margin: '0 auto' }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(240,236,230,0.92)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, padding: '0 16px' }}>
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
        <div>
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
