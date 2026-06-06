const { useEffect, useMemo, useState, useCallback, useRef } = React

// ── COLORS ────────────────────────────────────────────────────
const C = {
  bg: '#f0ece6', surface: '#ffffff', soft: '#f7f3ee',
  border: 'rgba(175,165,148,0.28)', borderMid: 'rgba(175,165,148,0.5)',
  text: '#18170f', mid: '#7a7268', light: '#b8b0a4',
  accent: '#2a7a4e', accentSoft: '#e6f3ec',
  warn: '#b89236', warnSoft: '#f7eed8',
  danger: '#b54d43', dangerSoft: '#faeae9',
  muted: '#8b8173', mutedSoft: '#efe9e0',
  shadow: '0 1px 4px rgba(20,14,6,0.06), 0 8px 24px rgba(20,14,6,0.08)',
  heavy: '0 4px 16px rgba(20,14,6,0.1), 0 32px 80px rgba(20,14,6,0.18)',
}

const JOB_STATUS = {
  waiting_for_review:         { label: 'Čeká na kontrolu',   dot: C.warn },
  waiting_for_client_details: { label: 'Čeká na klienta',    dot: C.muted },
  ready_to_offer:             { label: 'Připravena',          dot: C.accent },
  offered_to_painter:         { label: 'Nabídnuto malíři',   dot: C.warn },
  painter_accepted:           { label: 'Malíř přijal',       dot: C.accent },
  confirmed_to_client:        { label: 'Potvrzeno klientovi',dot: C.accent },
  in_progress:                { label: 'Probíhá',            dot: C.accent },
  completed:                  { label: 'Dokončeno',           dot: C.muted },
  cancelled:                  { label: 'Zrušeno',             dot: C.danger },
}

const AVAIL_COLOR = { available: C.accent, limited: C.warn, unavailable: C.danger }
const AVAIL_BG    = { available: C.accentSoft, limited: C.warnSoft, unavailable: C.dangerSoft }
const AVAIL_LABEL = { available: 'Volný', limited: 'Omezený', unavailable: 'Obsazený' }

// ── HELPERS ───────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10)

function fmt(v) {
  if (!Number.isFinite(Number(v)) || !Number(v)) return '—'
  return new Intl.NumberFormat('cs-CZ').format(Math.round(Number(v))) + ' Kč'
}
function commission(price) {
  const p = Number(price)
  if (!p) return '—'
  return fmt(Math.round(p * 0.15)) + ' (15 %)'
}
function fmtShort(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'short' }).format(new Date(d + 'T12:00:00Z'))
}
function fmtLong(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d + 'T12:00:00Z'))
}
function fmtDayName(d) {
  if (!d) return ''
  return new Intl.DateTimeFormat('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(new Date(d + 'T12:00:00Z'))
}
function ago(v) {
  const m = Math.round(Math.max(0, Date.now() - new Date(v)) / 60000)
  if (m < 1) return 'právě teď'
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} h`
}
function addDays(d, n) {
  const x = new Date(d + 'T12:00:00Z')
  x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}
function monthOf(d) { return d.slice(0, 7) + '-01' }
function addMonths(d, n) {
  const x = new Date(d + 'T12:00:00Z')
  x.setUTCDate(1); x.setUTCMonth(x.getUTCMonth() + n)
  return x.toISOString().slice(0, 10)
}

// ── STYLE HELPERS ─────────────────────────────────────────────
const btn = (bg, color = '#fff', border = 'transparent') => ({
  padding: '8px 14px', borderRadius: 10, border: `1px solid ${border}`,
  background: bg, color, fontSize: 12, fontWeight: 400,
  cursor: 'pointer', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap',
})
const ghostBtn = () => btn(C.surface, C.mid, C.border)
const primaryBtn = () => btn(C.accent)
const dangerBtn = () => btn(C.dangerSoft, C.danger, 'rgba(181,77,67,0.3)')
const inp = (extra = {}) => ({
  width: '100%', padding: '8px 10px', borderRadius: 10,
  border: `1px solid ${C.border}`, fontSize: 12,
  fontFamily: "'Outfit', sans-serif", outline: 'none',
  boxSizing: 'border-box', background: C.surface, ...extra,
})

function StatusDot({ status, size = 7 }) {
  const color = JOB_STATUS[status]?.dot || C.light
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: 99, background: color, flexShrink: 0 }} />
}
function AvailDot({ status, size = 8 }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: 99, background: AVAIL_COLOR[status] || C.light, flexShrink: 0 }} />
}
function Chip({ label, color, bg }) {
  return <span style={{ padding: '2px 8px', borderRadius: 99, background: bg, color, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
}

// ── LOGIN ─────────────────────────────────────────────────────
function Login({ onLogin, loading, error }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg }}>
      <div style={{ width: 380, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, boxShadow: C.shadow }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Malíř Hned · Admin</div>
        <h1 style={{ fontSize: 24, fontWeight: 400, color: C.text, letterSpacing: '-0.04em', margin: '0 0 18px' }}>Přihlášení</h1>
        <div style={{ display: 'grid', gap: 8 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" style={inp()} />
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Heslo" style={inp()} onKeyDown={e => e.key === 'Enter' && onLogin({ email, password: pw })} />
          {error && <div style={{ fontSize: 12, color: C.danger }}>{error}</div>}
          <button onClick={() => onLogin({ email, password: pw })} disabled={loading} style={primaryBtn()}>{loading ? 'Přihlašuji…' : 'Přihlásit'}</button>
        </div>
      </div>
    </div>
  )
}

// ── ASSIGN POPUP ──────────────────────────────────────────────
function AssignPopup({ job, painter, duration, onConfirm, onClose, busy }) {
  const price = job.confirmed_client_price || job.estimated_client_price_max || 0
  const payout = job.painter_reward || Math.round(price * 0.75)
  const comm = Math.round(price * 0.15)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,23,15,0.5)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: C.surface, borderRadius: 20, boxShadow: C.heavy, padding: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Potvrzení přiřazení</div>
        <h2 style={{ fontSize: 20, fontWeight: 500, color: C.text, letterSpacing: '-0.04em', margin: '0 0 16px' }}>Přiřadit {painter.name}?</h2>

        <div style={{ background: C.soft, borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'grid', gap: 6 }}>
          {[
            ['Klient', job.client_name],
            ['Termín', `${fmtShort(job.preferred_date)}${duration > 1 ? ` + ${duration - 1} ${duration === 2 ? 'den' : 'dny'}` : ''}`],
            ['Cena klientovi', fmt(price)],
            ['Odměna malíři', fmt(payout)],
            ['Provize dispečera', fmt(comm) + ' (15 %)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.light }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.accentSoft, borderRadius: 10, padding: '10px 12px', marginBottom: 6, fontSize: 12, color: C.accent }}>
          📱 Nabídka se odešle malíři {painter.name} do telefonu
        </div>
        <div style={{ background: C.warnSoft, borderRadius: 10, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: C.warn }}>
          ✉️ Po přijetí malířem bude klient automaticky informován e-mailem
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ ...ghostBtn(), flex: 1 }}>Zrušit</button>
          <button onClick={onConfirm} disabled={busy} style={{ ...primaryBtn(), flex: 2, padding: '10px' }}>
            {busy ? 'Odesílám…' : 'Potvrdit a odeslat nabídku'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── JOB LIST (LEFT) ───────────────────────────────────────────
function JobList({ jobs, activeJobId, onSelectJob, onSetCalDate }) {
  const [expandedId, setExpandedId] = useState(null)
  const [details, setDetails] = useState({})
  const [form, setForm] = useState({})

  async function loadDetail(jobId) {
    if (details[jobId]) return
    const r = await fetch(`/api/admin/job?id=${encodeURIComponent(jobId)}`)
    const d = await r.json()
    if (d.job) {
      setDetails(p => ({ ...p, [jobId]: d.job }))
      setForm(p => ({
        ...p, [jobId]: {
          confirmedPrice: d.job.confirmed_client_price || d.job.estimated_client_price_max || '',
          painterPayout: d.job.painter_reward || '',
        }
      }))
    }
  }

  function toggle(jobId) {
    if (expandedId === jobId) { setExpandedId(null); return }
    setExpandedId(jobId)
    loadDetail(jobId)
  }

  const active = jobs.filter(j => !['completed', 'cancelled'].includes(j.status))
  const closed = jobs.filter(j => ['completed', 'cancelled'].includes(j.status))

  function renderJob(job) {
    const exp = expandedId === job.id
    const detail = details[job.id]
    const f = form[job.id] || {}
    const s = JOB_STATUS[job.status] || { label: job.status, dot: C.light }
    const isActive = activeJobId === job.id
    return (
      <div key={job.id} style={{ borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => toggle(job.id)} style={{
          width: '100%', textAlign: 'left', border: 'none', padding: '10px 14px',
          background: isActive ? C.accentSoft : exp ? C.soft : C.surface,
          cursor: 'pointer', fontFamily: "'Outfit', sans-serif", display: 'grid', gap: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <StatusDot status={job.status} />
            <span style={{ fontSize: 13, fontWeight: 500, color: C.text, flex: 1 }}>{job.client_name || 'Klient'}</span>
            <span style={{ fontSize: 11, color: C.light }}>{ago(job.created_at)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 14 }}>
            <span style={{ fontSize: 11, color: C.mid }}>{fmtShort(job.preferred_date) || '—'}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: C.text }}>{fmt(job.estimated_client_price_max || job.estimated_price_high)}</span>
          </div>
        </button>

        {exp && (
          <div style={{ padding: '0 14px 14px', background: C.soft, borderTop: `1px solid ${C.border}` }}>
            {!detail ? (
              <div style={{ fontSize: 12, color: C.light, padding: '10px 0' }}>Načítám…</div>
            ) : (
              <>
                {/* Key info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', padding: '10px 0', fontSize: 11 }}>
                  {[
                    ['Telefon', detail.client_phone],
                    ['E-mail', detail.client_email],
                    ['Adresa', detail.client_address || detail.locality],
                    ['Typ práce', detail.work_type],
                    ['Plocha', detail.custom_area ? detail.custom_area + ' m²' : '—'],
                    ['Opravy', detail.repairs],
                    ['Stav', s.label],
                  ].map(([k, v]) => v ? (
                    <div key={k}>
                      <div style={{ color: C.light }}>{k}</div>
                      <div style={{ color: C.text, fontWeight: 400 }}>{v}</div>
                    </div>
                  ) : null)}
                </div>
                {detail.booking_note && (
                  <div style={{ fontSize: 11, color: C.mid, padding: '6px 0', borderTop: `1px solid ${C.border}` }}>{detail.booking_note}</div>
                )}

                {/* Commission preview */}
                <div style={{ background: C.soft, borderRadius: 8, padding: '7px 9px', margin: '8px 0', fontSize: 11, color: C.mid, borderTop: `1px solid ${C.border}` }}>
                  Provize dispečera: <strong style={{ color: C.text }}>{commission(detail.confirmed_client_price || detail.estimated_client_price_max)}</strong>
                </div>

                {/* Price inputs */}
                {!['completed', 'cancelled'].includes(job.status) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    <input value={f.confirmedPrice || ''} onChange={e => setForm(p => ({ ...p, [job.id]: { ...p[job.id], confirmedPrice: e.target.value } }))} placeholder="Cena klientovi" style={inp({ fontSize: 11 })} />
                    <input value={f.painterPayout || ''} onChange={e => setForm(p => ({ ...p, [job.id]: { ...p[job.id], painterPayout: e.target.value } }))} placeholder="Odměna malíři" style={inp({ fontSize: 11 })} />
                  </div>
                )}

                {/* Confirm date → jump to calendar */}
                {job.preferred_date && !['completed', 'cancelled'].includes(job.status) && (
                  <button
                    onClick={() => {
                      onSelectJob(job.id, f.confirmedPrice, f.painterPayout)
                      onSetCalDate(job.preferred_date)
                    }}
                    style={{ ...primaryBtn(), width: '100%', padding: '9px', fontSize: 12 }}
                  >
                    Vybrat malíře na {fmtShort(job.preferred_date)} →
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Zakázky · {active.length} aktivních
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {active.length === 0 && <div style={{ padding: 20, fontSize: 12, color: C.light, textAlign: 'center' }}>Žádné aktivní zakázky</div>}
        {active.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(renderJob)}
        {closed.length > 0 && (
          <>
            <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', background: C.soft }}>Uzavřené ({closed.length})</div>
            {closed.slice(0, 10).map(renderJob)}
          </>
        )}
      </div>
    </div>
  )
}

// ── AVAILABILITY CALENDAR (MIDDLE) ────────────────────────────
function AvailCalendar({ calDate, setCalDate, selectedDay, onSelectDay, dayCache, painters }) {
  // Show 4 days per row, 2 rows = 8 days total, navigable by 4
  const days = Array.from({ length: 8 }, (_, i) => addDays(calDate, i))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Nav */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => setCalDate(d => addDays(d, -4))} style={{ ...ghostBtn(), padding: '4px 10px', fontSize: 14 }}>‹</button>
        <button onClick={() => setCalDate(today)} style={{ ...ghostBtn(), fontSize: 11 }}>Dnes</button>
        <button onClick={() => setCalDate(d => addDays(d, 4))} style={{ ...ghostBtn(), padding: '4px 10px', fontSize: 14 }}>›</button>
        <span style={{ fontSize: 11, color: C.light, marginLeft: 4 }}>{fmtShort(calDate)} – {fmtShort(addDays(calDate, 7))}</span>
      </div>

      {/* 4-day grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {days.map(d => {
            const data = dayCache[d]
            const isSelected = d === selectedDay
            const isToday = d === today
            const isPast = d < today
            const painterList = data?.painters || painters.map(p => ({ ...p, availability_status: 'available' }))

            return (
              <button
                key={d}
                onClick={() => onSelectDay(d)}
                style={{
                  padding: '8px 8px 10px',
                  borderRadius: 12,
                  border: `1.5px solid ${isSelected ? C.accent : isToday ? C.borderMid : C.border}`,
                  background: isSelected ? C.accentSoft : isToday ? '#fff' : isPast ? C.soft : '#fff',
                  cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                  textAlign: 'left', opacity: isPast ? 0.6 : 1,
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: isSelected ? C.accent : isToday ? C.accent : C.mid }}>
                  {fmtDayName(d)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {painterList.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AvailDot status={p.availability_status} size={6} />
                      <span style={{ fontSize: 10, color: C.text, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── DAY DETAIL (RIGHT) ────────────────────────────────────────
function DayDetail({ selectedDay, dayCache, activeJob, activeJobDetail, onAssign }) {
  const [painterId, setPainterId] = useState('')
  const [duration, setDuration] = useState(1)
  const data = dayCache[selectedDay]
  const painters = data?.painters || []

  useEffect(() => { setPainterId(''); setDuration(1) }, [selectedDay])

  if (!selectedDay) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: 13, color: C.light, textAlign: 'center' }}>← Klikněte na den v kalendáři</div>
      </div>
    )
  }

  const selectedPainter = painters.find(p => p.id === painterId)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, letterSpacing: '-0.02em' }}>{fmtLong(selectedDay)}</div>
        {activeJob && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <StatusDot status={activeJob.status} size={6} />
            <span style={{ fontSize: 11, color: C.mid }}>Aktivní zakázka: <strong style={{ color: C.text }}>{activeJob.client_name}</strong></span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Painter selection */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Vybrat malíře</div>
          {painters.length === 0 && <div style={{ fontSize: 12, color: C.light }}>Načítám dostupnost…</div>}
          {painters.map(p => {
            const active = painterId === p.id
            const ac = AVAIL_COLOR[p.availability_status] || C.light
            const ab = AVAIL_BG[p.availability_status] || C.soft
            return (
              <button key={p.id} onClick={() => setPainterId(p.id)} style={{
                width: '100%', textAlign: 'left', marginBottom: 5, padding: '9px 10px',
                borderRadius: 10, border: `1.5px solid ${active ? C.accent : C.border}`,
                background: active ? C.accentSoft : C.surface,
                cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AvailDot status={p.availability_status} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{p.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: C.mid }}>kap. {p.remaining_capacity ?? p.capacity ?? '—'}</span>
                  <span style={{ padding: '2px 7px', borderRadius: 99, background: ab, color: ac, fontSize: 10, fontWeight: 500 }}>{AVAIL_LABEL[p.availability_status] || '—'}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Duration */}
        {painterId && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Délka zakázky</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[['1 den', 1], ['2 dny', 2], ['3+ dny', 3]].map(([label, val]) => (
                <button key={val} onClick={() => setDuration(val)} style={{
                  padding: '9px 6px', borderRadius: 10, fontFamily: "'Outfit', sans-serif", fontSize: 12,
                  border: `1.5px solid ${duration === val ? C.accent : C.border}`,
                  background: duration === val ? C.accentSoft : C.surface,
                  color: duration === val ? C.accent : C.mid, cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Confirm button */}
        {painterId && activeJob && (
          <button
            onClick={() => onAssign(selectedPainter, duration)}
            style={{ ...primaryBtn(), padding: '11px', fontSize: 13, borderRadius: 12, marginTop: 4 }}
          >
            Přiřadit {selectedPainter?.name} →
          </button>
        )}
        {painterId && !activeJob && (
          <div style={{ fontSize: 12, color: C.warn, padding: '8px 10px', background: C.warnSoft, borderRadius: 10 }}>
            Nejprve vyberte zakázku v levém sloupci
          </div>
        )}

        {/* Painter's job fit info */}
        {selectedPainter && (
          <div style={{ background: C.soft, borderRadius: 10, padding: '9px 11px', fontSize: 11, color: C.mid }}>
            {selectedPainter.service_areas?.join(', ') || 'Všechny oblasti'}
            {selectedPainter.note && <div style={{ marginTop: 4, color: C.mid }}>{selectedPainter.note}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── OPERATIONAL CALENDAR (TAB 2) ──────────────────────────────
function OpsCalendar({ jobs, painters }) {
  const [month, setMonth] = useState(monthOf(today))
  const [selectedJob, setSelectedJob] = useState(null)

  const monthLabel = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).format(new Date(month + 'T12:00:00Z'))
  const firstDow = (new Date(month + 'T12:00:00Z').getUTCDay() + 6) % 7
  const daysInMonth = new Date(new Date(month + 'T12:00:00Z').getUTCFullYear(), new Date(month + 'T12:00:00Z').getUTCMonth() + 1, 0).getUTCDate()

  // Map jobs to dates
  const jobMap = {}
  jobs.forEach(j => {
    if (j.preferred_date) {
      if (!jobMap[j.preferred_date]) jobMap[j.preferred_date] = []
      jobMap[j.preferred_date].push(j)
    }
  })

  return (
    <div style={{ padding: '16px 20px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMonth(m => addMonths(m, -1))} style={ghostBtn()}>‹</button>
        <span style={{ fontSize: 17, fontWeight: 500, color: C.text, letterSpacing: '-0.03em', textTransform: 'capitalize' }}>{monthLabel}</span>
        <button onClick={() => setMonth(m => addMonths(m, 1))} style={ghostBtn()}>›</button>
        <button onClick={() => setMonth(monthOf(today))} style={{ ...ghostBtn(), fontSize: 11, marginLeft: 4 }}>Dnes</button>
      </div>

      {/* Grid header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.07em', paddingBottom: 4 }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: firstDow }, (_, i) => <div key={`l${i}`} style={{ minHeight: 80, borderRadius: 10, background: 'transparent' }} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const num = i + 1
          const date = `${month.slice(0, 7)}-${String(num).padStart(2, '0')}`
          const dayJobs = jobMap[date] || []
          const isToday = date === today
          const isPast = date < today

          return (
            <div key={date} style={{
              minHeight: 80, borderRadius: 10, padding: '6px 7px',
              background: isToday ? '#fff' : isPast ? C.soft : '#fff',
              border: `1px solid ${isToday ? C.borderMid : C.border}`,
              opacity: isPast ? 0.7 : 1,
            }}>
              <div style={{ fontSize: 12, fontWeight: isToday ? 600 : 400, color: isToday ? C.accent : C.text, marginBottom: 4 }}>{num}</div>
              {dayJobs.map(j => {
                const s = JOB_STATUS[j.status] || { dot: C.light }
                return (
                  <button key={j.id} onClick={() => setSelectedJob(j)} style={{
                    width: '100%', textAlign: 'left', padding: '3px 5px', borderRadius: 6,
                    background: `${s.dot}18`, border: `1px solid ${s.dot}40`,
                    fontSize: 10, color: C.text, cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif", marginBottom: 2, display: 'block',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    <AvailDot status={undefined} size={5} /> {j.client_name || j.reference}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Job detail popup */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,23,15,0.4)', backdropFilter: 'blur(5px)' }} onClick={() => setSelectedJob(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: C.surface, borderRadius: 20, padding: 24, boxShadow: C.heavy }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{selectedJob.reference}</div>
                <h3 style={{ fontSize: 20, fontWeight: 500, color: C.text, margin: '4px 0 0', letterSpacing: '-0.04em' }}>{selectedJob.client_name}</h3>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ ...ghostBtn(), padding: '4px 9px', fontSize: 16 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '6px 16px', gridTemplateColumns: '1fr 1fr', fontSize: 12 }}>
              {[
                ['Stav', JOB_STATUS[selectedJob.status]?.label],
                ['Termín', fmtShort(selectedJob.preferred_date)],
                ['Telefon', selectedJob.client_phone],
                ['E-mail', selectedJob.client_email],
                ['Lokalita', selectedJob.locality],
                ['Typ práce', selectedJob.work_type],
                ['Cena', fmt(selectedJob.confirmed_client_price || selectedJob.estimated_client_price_max)],
                ['Odměna malíři', fmt(selectedJob.painter_reward)],
                ['Provize dispečera', commission(selectedJob.confirmed_client_price || selectedJob.estimated_client_price_max)],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: C.light, marginBottom: 2 }}>{k}</div>
                  <div style={{ color: C.text, fontWeight: 400 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── APP ───────────────────────────────────────────────────────
function App() {
  const [session, setSession] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dispatch')
  const [jobs, setJobs] = useState([])
  const [painters, setPainters] = useState([])

  // Dispatch state
  const [activeJobId, setActiveJobId] = useState(null)
  const [activeJobForm, setActiveJobForm] = useState({})
  const [calDate, setCalDate] = useState(today)
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayCache, setDayCache] = useState({})
  const [assignPopup, setAssignPopup] = useState(null) // { painter, duration }
  const [assignBusy, setAssignBusy] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')

  const activeJob = jobs.find(j => j.id === activeJobId) || null

  // Fetch day detail (per-painter) with cache
  const fetchDay = useCallback(async (date) => {
    if (dayCache[date]) return
    const q = new URLSearchParams({ from: monthOf(date), months: '1', date })
    try {
      const r = await fetch(`/api/admin/availability?${q}`)
      const d = await r.json()
      if (d.selected_day) setDayCache(p => ({ ...p, [date]: d.selected_day }))
    } catch {}
  }, [dayCache])

  // When calDate changes, fetch visible 8 days
  useEffect(() => {
    for (let i = 0; i < 8; i++) fetchDay(addDays(calDate, i))
  }, [calDate])

  // When day selected, fetch it too
  useEffect(() => {
    if (selectedDay) fetchDay(selectedDay)
  }, [selectedDay])

  useEffect(() => {
    fetch('/api/admin/session').then(r => r.json()).then(async d => {
      if (d.authenticated) {
        setSession(d.admin)
        const [jr, pr] = await Promise.all([
          fetch('/api/admin/jobs').then(r => r.json()),
          fetch('/api/admin/painters').then(r => r.json()),
        ])
        if (jr.jobs) setJobs(jr.jobs)
        if (pr.painters) setPainters(pr.painters)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!session) return
    const id = setInterval(() => {
      fetch('/api/admin/jobs').then(r => r.json()).then(d => { if (d.jobs) setJobs(d.jobs) })
    }, 30000)
    return () => clearInterval(id)
  }, [session])

  async function login(payload) {
    setLoginError(''); setLoading(true)
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const d = await r.json()
    if (!r.ok) { setLoginError(d.error || 'Chyba přihlášení'); setLoading(false); return }
    setSession({ email: d.email })
    const [jr, pr] = await Promise.all([
      fetch('/api/admin/jobs').then(r => r.json()),
      fetch('/api/admin/painters').then(r => r.json()),
    ])
    if (jr.jobs) setJobs(jr.jobs)
    if (pr.painters) setPainters(pr.painters)
    setLoading(false)
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setSession(null); setJobs([]); setPainters([])
  }

  function handleSelectJob(jobId, confirmedPrice, painterPayout) {
    setActiveJobId(jobId)
    setActiveJobForm({ confirmedPrice, painterPayout })
  }

  async function handleAssignConfirm() {
    if (!activeJobId || !assignPopup) return
    setAssignBusy(true); setAssignMsg('')

    const { painter, duration } = assignPopup
    const job = activeJob

    // 1. Prepare job (set prices)
    await fetch('/api/admin/job-action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: activeJobId, action: 'prepare_job',
        confirmedPrice: activeJobForm.confirmedPrice || job.estimated_client_price_max,
        painterPayout: activeJobForm.painterPayout || job.painter_reward,
      }),
    })

    // 2. Send offer to painter
    const r = await fetch('/api/admin/job-action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: activeJobId, action: 'send_offer', painterId: painter.id }),
    })
    const d = await r.json()

    // 3. Mark painter's days as limited/unavailable for duration
    for (let i = 0; i < duration; i++) {
      const date = addDays(selectedDay, i)
      await fetch('/api/admin/availability', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          painterId: painter.id, jobId: activeJobId,
          from: monthOf(date), months: 1, date,
          entries: [{ date, status: 'unavailable', capacity: 0, accepts_express: false, note: `Zakázka ${job.reference || activeJobId}` }],
        }),
      })
      // Invalidate cache for those days
      setDayCache(p => { const n = { ...p }; delete n[date]; return n })
    }

    setAssignBusy(false)
    setAssignPopup(null)
    setAssignMsg(d.result?.offerUrl ? `Nabídka odeslána. URL: ${d.result.offerUrl}` : 'Nabídka odeslána malíři.')

    // Refresh jobs + re-fetch calendar days
    fetch('/api/admin/jobs').then(r => r.json()).then(d => { if (d.jobs) setJobs(d.jobs) })
    for (let i = 0; i < 8; i++) fetchDay(addDays(calDate, i))
    if (selectedDay) fetchDay(selectedDay)
  }

  if (loading && !session) return <Login onLogin={login} loading={loading} error={loginError} />
  if (!session) return <Login onLogin={login} loading={loading} error={loginError} />

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(240,236,230,0.93)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Malíř Hned · Dispečink</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {assignMsg && <span style={{ fontSize: 11, color: C.accent }}>{assignMsg}</span>}
            <button onClick={logout} style={{ ...ghostBtn(), fontSize: 11, padding: '5px 10px' }}>Odhlásit</button>
          </div>
        </div>
        <div style={{ display: 'flex', borderTop: `1px solid ${C.border}` }}>
          {[['dispatch', `Dispečink${jobs.filter(j => !['completed','cancelled'].includes(j.status)).length ? ` (${jobs.filter(j => !['completed','cancelled'].includes(j.status)).length})` : ''}`], ['ops', 'Přehled zakázek']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '9px 20px', border: 'none', background: 'transparent',
              fontFamily: "'Outfit', sans-serif", fontSize: 13, cursor: 'pointer',
              color: tab === key ? C.accent : C.mid, fontWeight: tab === key ? 500 : 300,
              borderBottom: `2px solid ${tab === key ? C.accent : 'transparent'}`,
              marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Dispatch tab */}
      {tab === 'dispatch' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 320px 1fr', overflow: 'hidden', height: 'calc(100vh - 85px)' }}>
          {/* Left: job list */}
          <div style={{ borderRight: `1px solid ${C.border}`, background: C.surface, overflow: 'hidden' }}>
            <JobList
              jobs={jobs}
              activeJobId={activeJobId}
              onSelectJob={handleSelectJob}
              onSetCalDate={d => { setCalDate(d); setSelectedDay(d) }}
            />
          </div>

          {/* Middle: availability calendar */}
          <div style={{ borderRight: `1px solid ${C.border}`, background: C.surface, overflow: 'hidden' }}>
            <AvailCalendar
              calDate={calDate}
              setCalDate={setCalDate}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              dayCache={dayCache}
              painters={painters}
            />
          </div>

          {/* Right: day detail */}
          <div style={{ background: C.surface, overflow: 'hidden' }}>
            <DayDetail
              selectedDay={selectedDay}
              dayCache={dayCache}
              activeJob={activeJob}
              activeJobDetail={activeJobForm}
              onAssign={(painter, duration) => setAssignPopup({ painter, duration })}
            />
          </div>
        </div>
      )}

      {/* Ops calendar tab */}
      {tab === 'ops' && (
        <OpsCalendar jobs={jobs} painters={painters} />
      )}

      {/* Assign popup */}
      {assignPopup && activeJob && (
        <AssignPopup
          job={{ ...activeJob, ...activeJobForm, confirmed_client_price: activeJobForm.confirmedPrice, painter_reward: activeJobForm.painterPayout }}
          painter={assignPopup.painter}
          duration={assignPopup.duration}
          onConfirm={handleAssignConfirm}
          onClose={() => setAssignPopup(null)}
          busy={assignBusy}
        />
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
