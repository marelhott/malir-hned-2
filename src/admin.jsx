const { useEffect, useMemo, useState, useCallback } = React

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
  waiting_for_review:         { label: 'Čeká na kontrolu',    dot: C.warn },
  waiting_for_client_details: { label: 'Čeká na klienta',     dot: C.muted },
  ready_to_offer:             { label: 'Připravena',           dot: C.accent },
  offered_to_painter:         { label: 'Nabídnuto malíři',    dot: C.warn },
  painter_accepted:           { label: 'Malíř přijal',        dot: C.accent },
  confirmed_to_client:        { label: 'Potvrzeno klientovi', dot: C.accent },
  in_progress:                { label: 'Probíhá',             dot: C.accent },
  completed:                  { label: 'Dokončeno',            dot: C.muted },
  cancelled:                  { label: 'Zrušeno',              dot: C.danger },
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
function ago(v) {
  const m = Math.round(Math.max(0, Date.now() - new Date(v)) / 60000)
  if (m < 1) return 'právě teď'
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} h`
}
function addDays(d, n) {
  const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}
function monthOf(d) { return d.slice(0, 7) + '-01' }
function addMonths(d, n) {
  const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(1); x.setUTCMonth(x.getUTCMonth() + n)
  return x.toISOString().slice(0, 10)
}
function daysInMonth(m) {
  const d = new Date(m + 'T12:00:00Z')
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
}
function firstDow(m) { return (new Date(m + 'T12:00:00Z').getUTCDay() + 6) % 7 }

// ── STYLE HELPERS ─────────────────────────────────────────────
const btn = (bg, color = '#fff', border = 'transparent') => ({
  padding: '9px 16px', borderRadius: 10, border: `1px solid ${border}`,
  background: bg, color, fontSize: 13, fontWeight: 500,
  cursor: 'pointer', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap',
})
const ghostBtn = () => btn(C.surface, C.mid, C.border)
const primaryBtn = () => btn(C.accent)
const inp = (extra = {}) => ({
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: `1px solid ${C.border}`, fontSize: 13,
  fontFamily: "'Outfit', sans-serif", outline: 'none',
  boxSizing: 'border-box', background: C.surface, ...extra,
})
function ColHeader({ children }) {
  return <div style={{ padding: '11px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>{children}</div>
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

// ── COL 1: JOB LIST ───────────────────────────────────────────
function JobList({ jobs, activeJobId, onSelectJob, onSetCalDate }) {
  const [expandedId, setExpandedId] = useState(null)
  const [details, setDetails] = useState({})
  const [form, setForm] = useState({})

  async function loadDetail(jobId) {
    if (details[jobId]) return
    const r = await fetch(`/api/admin/job?id=${encodeURIComponent(jobId)}`)
    const d = await r.json()
    if (!d.job) return
    setDetails(p => ({ ...p, [jobId]: d.job }))
    setForm(p => ({ ...p, [jobId]: {
      confirmedPrice: d.job.confirmed_client_price || d.job.estimated_client_price_max || '',
      painterPayout:  d.job.painter_reward || '',
    }}))
  }

  function toggle(id) {
    setExpandedId(p => p === id ? null : id)
    loadDetail(id)
  }

  const active = jobs.filter(j => !['completed','cancelled'].includes(j.status)).sort((a,b) => new Date(a.created_at)-new Date(b.created_at))
  const closed = jobs.filter(j => ['completed','cancelled'].includes(j.status)).slice(0, 8)

  function renderJob(job) {
    const exp = expandedId === job.id
    const detail = details[job.id]
    const f = form[job.id] || {}
    const isActive = activeJobId === job.id
    const s = JOB_STATUS[job.status] || { dot: C.light, label: job.status }

    return (
      <div key={job.id} style={{ borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => toggle(job.id)} style={{
          width: '100%', textAlign: 'left', border: 'none', padding: '12px 16px',
          background: isActive ? C.accentSoft : exp ? C.soft : C.surface,
          cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: s.dot, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1 }}>{job.client_name || 'Klient'}</span>
            <span style={{ fontSize: 11, color: C.light }}>{ago(job.created_at)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 16 }}>
            <span style={{ fontSize: 12, color: C.mid }}>{fmtShort(job.preferred_date)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{fmt(job.estimated_client_price_max || job.estimated_price_high)}</span>
          </div>
        </button>

        {exp && (
          <div style={{ padding: '12px 16px 14px', background: C.soft, borderTop: `1px solid ${C.border}` }}>
            {!detail
              ? <div style={{ fontSize: 12, color: C.light }}>Načítám…</div>
              : <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 14px', fontSize: 12, marginBottom: 10 }}>
                    {[['Tel', detail.client_phone], ['Mail', detail.client_email],
                      ['Adresa', detail.client_address || detail.locality],
                      ['Práce', detail.work_type], ['Plocha', detail.custom_area ? detail.custom_area+' m²' : null],
                      ['Opravy', detail.repairs], ['Stav', s.label]]
                      .filter(([,v]) => v).map(([k,v]) => (
                        <div key={k}><div style={{ color: C.light, fontSize: 11 }}>{k}</div><div style={{ color: C.text }}>{v}</div></div>
                      ))}
                  </div>
                  {detail.booking_note && <div style={{ fontSize: 12, color: C.mid, marginBottom: 10, lineHeight: 1.5 }}>{detail.booking_note}</div>}
                  <div style={{ fontSize: 12, color: C.mid, background: C.surface, borderRadius: 8, padding: '7px 10px', marginBottom: 10 }}>
                    Provize: <strong style={{ color: C.text }}>{commission(detail.confirmed_client_price || detail.estimated_client_price_max)}</strong>
                  </div>
                  {!['completed','cancelled'].includes(job.status) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
                      <input value={f.confirmedPrice||''} onChange={e => setForm(p=>({...p,[job.id]:{...p[job.id],confirmedPrice:e.target.value}}))} placeholder="Cena klientovi" style={inp()} />
                      <input value={f.painterPayout||''} onChange={e => setForm(p=>({...p,[job.id]:{...p[job.id],painterPayout:e.target.value}}))} placeholder="Odměna malíři" style={inp()} />
                    </div>
                  )}
                  {job.preferred_date && !['completed','cancelled'].includes(job.status) && (
                    <button onClick={() => { onSelectJob(job.id, f.confirmedPrice, f.painterPayout); onSetCalDate(job.preferred_date) }}
                      style={{ ...primaryBtn(), width: '100%', padding: '10px' }}>
                      Vybrat malíře na {fmtShort(job.preferred_date)} →
                    </button>
                  )}
                </>
            }
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ColHeader>Zakázky · {active.length} aktivních</ColHeader>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {active.length === 0 && <div style={{ padding: 20, fontSize: 12, color: C.light, textAlign: 'center' }}>Žádné aktivní zakázky</div>}
        {active.map(renderJob)}
        {closed.length > 0 && <>
          <div style={{ padding: '7px 14px', fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', background: C.soft }}>Uzavřené ({closed.length})</div>
          {closed.map(renderJob)}
        </>}
      </div>
    </div>
  )
}

// ── COL 2: MONTHLY CALENDAR ───────────────────────────────────
// 3 status styles — elegant, light
const STATUS_STYLE = {
  available:   { pill: 'rgba(30,138,74,0.10)',  text: '#1a6b3a', dot: '#22c55e', strike: false },
  limited:     { pill: 'rgba(212,144,10,0.10)', text: '#92620a', dot: '#f59e0b', strike: false },
  unavailable: { pill: 'rgba(212,59,53,0.08)',  text: '#b91c1c', dot: '#ef4444', strike: true  },
  unknown:     { pill: 'rgba(0,0,0,0.04)',       text: '#aaa',    dot: '#d1d5db', strike: false },
}

function MonthCalendar({ selectedDay, onSelectDay, monthBase, setMonthBase, monthData, painters, activeJob }) {
  const days = daysInMonth(monthBase)
  const leading = firstDow(monthBase)
  const monthLabel = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' })
    .format(new Date(monthBase + 'T12:00:00Z'))

  const calMap = {}
  ;(monthData?.months?.[0]?.cal || []).forEach(d => { calMap[d.date] = d })

  const jobDate = activeJob?.preferred_date

  function getPainterStatuses(info) {
    const avail   = info.available_count   || 0
    const limited = info.limited_count     || 0
    const blocked = info.blocked_count     || 0
    return painters.map((_, i) => {
      if (i < avail)                     return 'available'
      if (i < avail + limited)           return 'limited'
      if (i < avail + limited + blocked) return 'unavailable'
      return 'unknown'
    })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => setMonthBase(m => addMonths(m, -1))} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.mid, display:'flex',alignItems:'center',justifyContent:'center' }}>‹</button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600, color: C.text, textTransform: 'capitalize', letterSpacing: '-0.01em' }}>{monthLabel}</span>
        <button onClick={() => setMonthBase(m => addMonths(m, 1))} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.mid, display:'flex',alignItems:'center',justifyContent:'center' }}>›</button>
        <button onClick={() => setMonthBase(monthOf(today))} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: C.mid, fontFamily:"'Outfit',sans-serif", fontWeight:500 }}>Dnes</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Day-of-week header row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${C.border}` }}>
          {['Pon','Úte','Stř','Čtv','Pát','Sob','Ned'].map((d, i) => (
            <div key={d} style={{
              padding: '8px 0',
              textAlign: 'center',
              fontSize: 11, fontWeight: 600,
              color: i >= 5 ? '#94a3b8' : '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              borderRight: i < 6 ? `1px solid ${C.border}` : 'none',
            }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid — no gaps, full-bleed cells with dividers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {Array.from({ length: leading }, (_, i) => (
            <div key={`l${i}`} style={{
              borderRight: `1px solid ${C.border}`,
              borderBottom: `1px solid ${C.border}`,
              minHeight: 110,
              background: '#fafafa',
            }} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const num = i + 1
            const date = `${monthBase.slice(0, 7)}-${String(num).padStart(2, '0')}`
            const info = calMap[date] || {}
            const isToday = date === today
            const isSelected = date === selectedDay
            const isJobDay = date === jobDate
            const isPast = date < today
            const colIndex = (leading + i) % 7
            const isWeekend = colIndex >= 5
            const isLastCol = colIndex === 6
            const painterStatuses = getPainterStatuses(info)

            return (
              <button key={date} onClick={() => onSelectDay(date)} style={{
                padding: '8px 10px 10px',
                borderRight: isLastCol ? 'none' : `1px solid ${C.border}`,
                borderBottom: `1px solid ${C.border}`,
                background: isSelected ? '#f0faf5'
                  : isJobDay ? '#fffbeb'
                  : isWeekend ? '#fafafa'
                  : '#fff',
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                textAlign: 'left',
                opacity: isPast && !isSelected && !isToday ? 0.5 : 1,
                display: 'flex', flexDirection: 'column', gap: 5,
                minHeight: 110,
                outline: isSelected ? `2px solid ${C.accent}` : isJobDay ? `2px solid ${C.warn}` : 'none',
                outlineOffset: '-2px',
                transition: 'background 0.1s',
              }}>
                {/* Date number */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 }}>
                  <span style={{
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#fff'
                      : isSelected ? C.accent
                      : isJobDay ? C.warn
                      : isWeekend ? '#94a3b8'
                      : '#374151',
                    background: isToday ? C.accent : 'transparent',
                    borderRadius: 99,
                    width: isToday ? 26 : 'auto',
                    height: isToday ? 26 : 'auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    lineHeight: 1,
                  }}>{num}</span>
                  {isJobDay && (
                    <span style={{ fontSize: 9, color: C.warn, fontWeight: 700, letterSpacing: '0.03em' }}>TERMÍN</span>
                  )}
                </div>

                {/* Painter pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                  {painters.map((p, pi) => {
                    const status = painterStatuses[pi]
                    const s = STATUS_STYLE[status] || STATUS_STYLE.unknown
                    const firstName = (p.name || p.email || '?').split(' ')[0]
                    return (
                      <div key={pi} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: s.pill,
                        borderRadius: 5,
                        padding: '3px 7px',
                      }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: 99,
                          background: s.dot, flexShrink: 0,
                          display: 'inline-block',
                        }} />
                        <span style={{
                          fontSize: 12, fontWeight: 500,
                          color: s.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1, minWidth: 0,
                          textDecoration: s.strike ? 'line-through' : 'none',
                          opacity: s.strike ? 0.6 : 1,
                        }}>{firstName}</span>
                      </div>
                    )
                  })}
                </div>
              </button>
            )
          })}
          {/* Fill remaining cells in last row */}
          {(() => {
            const total = leading + days
            const remainder = total % 7 === 0 ? 0 : 7 - (total % 7)
            return Array.from({ length: remainder }, (_, i) => (
              <div key={`t${i}`} style={{
                borderRight: i < remainder - 1 ? `1px solid ${C.border}` : 'none',
                borderBottom: `1px solid ${C.border}`,
                minHeight: 110,
                background: '#fafafa',
              }} />
            ))
          })()}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, padding: '10px 16px', alignItems: 'center', borderTop: `1px solid ${C.border}` }}>
          {[['available','Volný'],['limited','Nevím jistě'],['unavailable','Obsazený']].map(([k,l]) => {
            const s = STATUS_STYLE[k]
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: s.dot, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{l}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── COL 3: PAINTER AVAILABILITY ───────────────────────────────
function PainterAvail({ selectedDay, dayCache, activeJob, onSelectPainter, selectedPainterId }) {
  const data = dayCache[selectedDay]
  const painters = data?.painters || []

  if (!selectedDay) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ColHeader>Malíři</ColHeader>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: C.light }}>← Vyberte den</span>
      </div>
    </div>
  )

  const jobDate = activeJob?.preferred_date
  const isMatchDay = selectedDay === jobDate

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ColHeader>Malíři · {fmtShort(selectedDay)}</ColHeader>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {isMatchDay && activeJob && (
          <div style={{ background: C.warnSoft, borderRadius: 9, padding: '7px 10px', fontSize: 11, color: C.warn, marginBottom: 2 }}>
            Preferovaný termín zakázky: <strong>{activeJob.client_name}</strong>
          </div>
        )}
        {!data && <div style={{ fontSize: 11, color: C.light, padding: '10px 0' }}>Načítám…</div>}
        {painters.map(p => {
          const ac = AVAIL_COLOR[p.availability_status] || C.light
          const ab = AVAIL_BG[p.availability_status] || C.soft
          const isSelected = selectedPainterId === p.id
          const hasOverlap = p.block_count > 0

          return (
            <button key={p.id} onClick={() => onSelectPainter(p)} style={{
              width: '100%', textAlign: 'left', padding: '10px 11px', borderRadius: 10,
              border: `1.5px solid ${isSelected ? C.accent : C.border}`,
              background: isSelected ? C.accentSoft : C.surface,
              cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <div style={{ width: 9, height: 9, borderRadius: 99, background: ac, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text, flex: 1 }}>{p.name}</span>
                <span style={{ padding: '2px 7px', borderRadius: 99, background: ab, color: ac, fontSize: 10, fontWeight: 500 }}>
                  {AVAIL_LABEL[p.availability_status] || '—'}
                </span>
              </div>
              <div style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 10, color: C.light }}>
                  Kapacita: <span style={{ color: C.text }}>{p.remaining_capacity ?? p.capacity ?? '—'}</span>
                  {' · '}
                  {p.accepts_express ? <span style={{ color: C.accent }}>bere expres</span> : <span style={{ color: C.light }}>ne expres</span>}
                </div>
                {hasOverlap && (
                  <div style={{ fontSize: 10, color: C.danger }}>⚠ {p.block_count} blokace v tomto dni</div>
                )}
                {p.job_fit?.locality_match === false && (
                  <div style={{ fontSize: 10, color: C.warn }}>Mimo lokalitu zakázky</div>
                )}
                {p.note && <div style={{ fontSize: 10, color: C.mid, lineHeight: 1.4 }}>{p.note}</div>}
                {p.service_areas?.length > 0 && (
                  <div style={{ fontSize: 10, color: C.light }}>{p.service_areas.join(', ')}</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── COL 4: DETAIL + CONFIRM ───────────────────────────────────
function AssignDetail({ activeJob, activeJobForm, selectedPainter, selectedDay, onAssign, busy, msg }) {
  const [duration, setDuration] = useState(1)

  useEffect(() => setDuration(1), [selectedPainter, selectedDay])

  const price = Number(activeJobForm.confirmedPrice) || Number(activeJob?.estimated_client_price_max) || 0
  const payout = Number(activeJobForm.painterPayout) || Number(activeJob?.painter_reward) || Math.round(price * 0.75)
  const comm = Math.round(price * 0.15)

  if (!activeJob && !selectedPainter) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ColHeader>Detail &amp; odeslání</ColHeader>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: C.light, textAlign: 'center', padding: 20 }}>Vyberte zakázku a malíře</span>
      </div>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ColHeader>Detail &amp; odeslání</ColHeader>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Job summary */}
        {activeJob && (
          <div style={{ background: C.soft, borderRadius: 11, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>Zakázka</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>{activeJob.client_name}</div>
            <div style={{ display: 'grid', gap: '3px 0', fontSize: 11, color: C.mid }}>
              <div>{activeJob.client_phone} · {activeJob.client_email}</div>
              <div>{activeJob.client_address || activeJob.locality || '—'}</div>
              <div>{activeJob.work_type} {activeJob.custom_area ? '· '+activeJob.custom_area+' m²' : ''}</div>
            </div>
          </div>
        )}

        {/* Painter summary */}
        {selectedPainter && (
          <div style={{ background: C.soft, borderRadius: 11, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>Malíř</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <div style={{ width: 9, height: 9, borderRadius: 99, background: AVAIL_COLOR[selectedPainter.availability_status] || C.light }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{selectedPainter.name}</span>
              <span style={{ fontSize: 11, color: C.mid }}>{AVAIL_LABEL[selectedPainter.availability_status]}</span>
            </div>
            <div style={{ fontSize: 11, color: C.mid }}>Termín: <strong style={{ color: C.text }}>{fmtLong(selectedDay)}</strong></div>
          </div>
        )}

        {/* Financial summary */}
        {activeJob && (
          <div style={{ background: C.soft, borderRadius: 11, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Financování</div>
            {[
              ['Cena klientovi', fmt(price)],
              ['Odměna malíři',  fmt(payout)],
              ['Provize dispečera', fmt(comm) + ' (15 %)'],
            ].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: C.mid }}>{k}</span>
                <span style={{ color: C.text, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Duration */}
        {selectedPainter && selectedDay && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>Délka zakázky</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[['1 den',1],['2 dny',2],['3+ dny',3]].map(([label,val]) => (
                <button key={val} onClick={() => setDuration(val)} style={{
                  padding: '8px 4px', borderRadius: 9, fontFamily: "'Outfit', sans-serif", fontSize: 11,
                  border: `1.5px solid ${duration===val ? C.accent : C.border}`,
                  background: duration===val ? C.accentSoft : C.surface,
                  color: duration===val ? C.accent : C.mid, cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>
            {duration > 1 && (
              <div style={{ fontSize: 10, color: C.mid, marginTop: 6 }}>
                Obsadí: {Array.from({length:duration},(_,i)=>fmtShort(addDays(selectedDay,i))).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {msg && (
          <div style={{ background: msg.includes('fail') || msg.includes('Chyba') ? C.dangerSoft : C.accentSoft, borderRadius: 9, padding: '8px 11px', fontSize: 11, color: msg.includes('fail') || msg.includes('Chyba') ? C.danger : C.accent }}>
            {msg}
          </div>
        )}

        {/* Action buttons */}
        {activeJob && selectedPainter && selectedDay && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <div style={{ background: C.accentSoft, borderRadius: 9, padding: '8px 11px', fontSize: 11, color: C.accent }}>
              📱 Nabídka odejde malíři {selectedPainter.name} do telefonu
            </div>
            <div style={{ background: C.warnSoft, borderRadius: 9, padding: '8px 11px', fontSize: 11, color: C.warn }}>
              ✉️ Po přijetí malířem bude klient ({activeJob.client_email}) automaticky informován e-mailem
            </div>
            <button
              disabled={busy}
              onClick={() => onAssign(selectedPainter, duration)}
              style={{ ...primaryBtn(), padding: '12px', fontSize: 13, borderRadius: 11, marginTop: 2 }}
            >
              {busy ? 'Odesílám…' : `Potvrdit a odeslat nabídku malíři ${selectedPainter.name}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── OPS CALENDAR (TAB 2) ──────────────────────────────────────
function OpsCalendar({ jobs }) {
  const [month, setMonth] = useState(monthOf(today))
  const [popup, setPopup] = useState(null)

  const monthLabel = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).format(new Date(month + 'T12:00:00Z'))
  const days = daysInMonth(month)
  const leading = firstDow(month)

  const jobMap = {}
  jobs.forEach(j => {
    const date = j.preferred_date
    if (date) {
      if (!jobMap[date]) jobMap[date] = []
      jobMap[date].push(j)
    }
  })

  return (
    <div style={{ padding: '14px 20px 32px', overflowY: 'auto', height: 'calc(100vh - 82px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button onClick={() => setMonth(m => addMonths(m, -1))} style={ghostBtn()}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 500, color: C.text, textTransform: 'capitalize', flex: 1, textAlign: 'center' }}>{monthLabel}</span>
        <button onClick={() => setMonth(m => addMonths(m, 1))} style={ghostBtn()}>›</button>
        <button onClick={() => setMonth(monthOf(today))} style={{ ...ghostBtn(), fontSize: 11 }}>Dnes</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota','Neděle'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.light, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 4 }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {Array.from({length:leading},(_,i) => <div key={`l${i}`} style={{ minHeight: 140 }} />)}
        {Array.from({length:days},(_,i) => {
          const num = i + 1
          const date = `${month.slice(0,7)}-${String(num).padStart(2,'0')}`
          const dayJobs = jobMap[date] || []
          const isToday = date === today
          const isPast = date < today

          return (
            <div key={date} style={{
              minHeight: 140,
              borderRadius: 10,
              padding: '8px 9px',
              background: isToday ? '#fff' : isPast ? '#faf8f5' : '#fff',
              border: `1px solid ${isToday ? C.borderMid : C.border}`,
            }}>
              {/* Day number */}
              <div style={{
                fontSize: 13, fontWeight: isToday ? 700 : 400,
                color: isToday ? C.accent : isPast ? C.light : C.text,
                marginBottom: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{num}</span>
                {dayJobs.length > 0 && (
                  <span style={{ fontSize: 10, color: C.light, fontWeight: 400 }}>{dayJobs.length} zak.</span>
                )}
              </div>

              {/* Job cards in this day */}
              {dayJobs.map(j => {
                const s = JOB_STATUS[j.status] || { dot: C.light, label: j.status }
                const price = j.confirmed_client_price || j.estimated_client_price_max
                return (
                  <button key={j.id} onClick={() => setPopup(j)} style={{
                    width: '100%', textAlign: 'left', padding: '7px 8px', borderRadius: 8,
                    marginBottom: 4, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    background: C.soft, border: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${s.dot}`,
                    display: 'block',
                  }}>
                    {/* Client name */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {j.client_name || 'Klient'}
                    </div>
                    {/* Painter */}
                    {j.assigned_painter_name && (
                      <div style={{ fontSize: 10, color: C.accent, marginBottom: 2 }}>
                        👷 {j.assigned_painter_name}
                      </div>
                    )}
                    {/* Price + work type */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: C.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {j.work_type || j.locality || '—'}
                      </span>
                      {price ? <span style={{ fontSize: 10, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{fmt(price)}</span> : null}
                    </div>
                    {/* Status chip */}
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: s.dot, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {s.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {popup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,23,15,0.4)', backdropFilter: 'blur(5px)' }} onClick={() => setPopup(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 420, background: C.surface, borderRadius: 20, padding: 24, boxShadow: C.heavy }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{popup.reference}</div>
                <h3 style={{ fontSize: 20, fontWeight: 500, color: C.text, margin: '4px 0 0', letterSpacing: '-0.04em' }}>{popup.client_name}</h3>
              </div>
              <button onClick={() => setPopup(null)} style={{ ...ghostBtn(), padding: '4px 9px', fontSize: 16 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '8px 16px', gridTemplateColumns: '1fr 1fr', fontSize: 12 }}>
              {[
                ['Stav', JOB_STATUS[popup.status]?.label],
                ['Termín', fmtShort(popup.preferred_date)],
                ['Malíř', popup.assigned_painter_name],
                ['Lokalita', popup.locality || popup.client_address],
                ['Telefon', popup.client_phone],
                ['E-mail', popup.client_email],
                ['Typ práce', popup.work_type],
                ['Plocha', popup.custom_area ? popup.custom_area + ' m²' : null],
                ['Opravy', popup.repairs],
                ['Cena klientovi', fmt(popup.confirmed_client_price || popup.estimated_client_price_max)],
                ['Odměna malíři', fmt(popup.painter_reward)],
                ['Provize dispečera', commission(popup.confirmed_client_price || popup.estimated_client_price_max)],
              ].filter(([,v])=>v).map(([k,v]) => (
                <div key={k}>
                  <div style={{ color: C.light, marginBottom: 2, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{k}</div>
                  <div style={{ color: C.text, fontWeight: 400 }}>{v}</div>
                </div>
              ))}
            </div>
            {popup.booking_note && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.mid, lineHeight: 1.6 }}>
                {popup.booking_note}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── APP ───────────────────────────────────────────────────────
function App() {
  const [session,    setSession]    = useState(null)
  const [loginError, setLoginError] = useState('')
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('dispatch')
  const [jobs,       setJobs]       = useState([])
  const [painters,   setPainters]   = useState([])

  // Dispatch state
  const [activeJobId,   setActiveJobId]   = useState(null)
  const [activeJobForm, setActiveJobForm] = useState({})
  const [monthBase,     setMonthBase]     = useState(monthOf(today))
  const [selectedDay,   setSelectedDay]   = useState(null)
  const [selectedPainter, setSelectedPainter] = useState(null)
  const [dayCache,      setDayCache]      = useState({})
  const [monthData,     setMonthData]     = useState(null)
  const [assignBusy,    setAssignBusy]    = useState(false)
  const [assignMsg,     setAssignMsg]     = useState('')

  const activeJob = jobs.find(j => j.id === activeJobId) || null

  // Fetch month aggregate data
  useEffect(() => {
    const q = new URLSearchParams({ from: monthBase, months: '1' })
    fetch(`/api/admin/availability?${q}`).then(r => r.json()).then(setMonthData).catch(() => {})
  }, [monthBase])

  // Fetch per-painter detail for selected day
  const fetchDay = useCallback(async (date) => {
    if (!date || dayCache[date]) return
    const q = new URLSearchParams({ from: monthOf(date), months: '1', date })
    try {
      const r = await fetch(`/api/admin/availability?${q}`)
      const d = await r.json()
      if (d.selected_day) setDayCache(p => ({ ...p, [date]: d.selected_day }))
    } catch {}
  }, [dayCache])

  useEffect(() => { fetchDay(selectedDay) }, [selectedDay])

  // Session + initial data
  useEffect(() => {
    fetch('/api/admin/session').then(r => r.json()).then(async d => {
      if (d.authenticated) {
        setSession(d.admin)
        const [jr, pr] = await Promise.all([
          fetch('/api/admin/jobs').then(r => r.json()),
          fetch('/api/admin/painters').then(r => r.json()),
        ])
        if (jr.jobs)     setJobs(jr.jobs)
        if (pr.painters) setPainters(pr.painters)
      }
      setLoading(false)
    })
  }, [])

  // Auto-refresh jobs
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
    if (jr.jobs)     setJobs(jr.jobs)
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
    setSelectedPainter(null)
    setAssignMsg('')
  }

  function handleSetCalDate(date) {
    setMonthBase(monthOf(date))
    setSelectedDay(date)
  }

  async function handleAssign(painter, duration) {
    if (!activeJobId || !painter || !selectedDay) return
    setAssignBusy(true); setAssignMsg('')

    try {
      // 1. Prepare job
      await fetch('/api/admin/job-action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: activeJobId, action: 'prepare_job',
          confirmedPrice: activeJobForm.confirmedPrice || activeJob?.estimated_client_price_max,
          painterPayout:  activeJobForm.painterPayout  || activeJob?.painter_reward,
        }),
      })

      // 2. Send offer
      await fetch('/api/admin/job-action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: activeJobId, action: 'send_offer', painterId: painter.id }),
      })

      // 3. Mark painter days as unavailable
      for (let i = 0; i < duration; i++) {
        const date = addDays(selectedDay, i)
        await fetch('/api/admin/availability', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            painterId: painter.id, jobId: activeJobId,
            from: monthOf(date), months: 1, date,
            entries: [{ date, status: 'unavailable', capacity: 0, accepts_express: false, note: activeJob?.reference || '' }],
          }),
        })
        setDayCache(p => { const n = {...p}; delete n[date]; return n })
      }

      setAssignMsg(`✓ Nabídka odeslána malíři ${painter.name}. Po přijetí bude klient informován e-mailem.`)
      fetch('/api/admin/jobs').then(r => r.json()).then(d => { if (d.jobs) setJobs(d.jobs) })
      // Refresh month data
      fetch(`/api/admin/availability?${new URLSearchParams({from:monthBase,months:'1'})}`).then(r=>r.json()).then(setMonthData)
    } catch {
      setAssignMsg('Chyba při odesílání. Zkuste znovu.')
    }
    setAssignBusy(false)
  }

  if (loading && !session) return <Login onLogin={login} loading={loading} error={loginError} />
  if (!session)             return <Login onLogin={login} loading={loading} error={loginError} />

  const activeCount = jobs.filter(j => !['completed','cancelled'].includes(j.status)).length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(240,236,230,0.93)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 46 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Malíř Hned · Dispečink</span>
          <button onClick={logout} style={{ ...ghostBtn(), fontSize: 11, padding: '5px 10px' }}>Odhlásit</button>
        </div>
        <div style={{ display: 'flex', borderTop: `1px solid ${C.border}` }}>
          {[['dispatch', `Dispečink${activeCount ? ` (${activeCount})` : ''}`], ['ops', 'Přehled zakázek']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '8px 20px', border: 'none', background: 'transparent',
              fontFamily: "'Outfit', sans-serif", fontSize: 12, cursor: 'pointer',
              color: tab === key ? C.accent : C.mid, fontWeight: tab === key ? 500 : 300,
              borderBottom: `2px solid ${tab === key ? C.accent : 'transparent'}`, marginBottom: -1,
            }}>{label}</button>
          ))}
          {assignMsg && <span style={{ fontSize: 11, color: C.accent, display: 'flex', alignItems: 'center', paddingLeft: 16 }}>{assignMsg}</span>}
        </div>
      </div>

      {/* Dispatch tab — 4 columns */}
      {tab === 'dispatch' && (
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '300px 1fr 240px 300px',
          height: 'calc(100vh - 82px)',
          overflow: 'hidden',
        }}>
          {/* Col 1 */}
          <div style={{ borderRight: `1px solid ${C.border}`, background: C.surface, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <JobList
              jobs={jobs}
              activeJobId={activeJobId}
              onSelectJob={handleSelectJob}
              onSetCalDate={handleSetCalDate}
            />
          </div>

          {/* Col 2 — monthly calendar */}
          <div style={{ borderRight: `1px solid ${C.border}`, background: C.surface, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <MonthCalendar
              selectedDay={selectedDay}
              onSelectDay={date => { setSelectedDay(date); setSelectedPainter(null) }}
              monthBase={monthBase}
              setMonthBase={setMonthBase}
              monthData={monthData}
              painters={painters}
              activeJob={activeJob}
            />
          </div>

          {/* Col 3 — painter availability */}
          <div style={{ borderRight: `1px solid ${C.border}`, background: C.surface, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <PainterAvail
              selectedDay={selectedDay}
              dayCache={dayCache}
              activeJob={activeJob}
              onSelectPainter={p => { setSelectedPainter(p); setAssignMsg('') }}
              selectedPainterId={selectedPainter?.id}
            />
          </div>

          {/* Col 4 — detail + confirm */}
          <div style={{ background: C.surface, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <AssignDetail
              activeJob={activeJob}
              activeJobForm={activeJobForm}
              selectedPainter={selectedPainter}
              selectedDay={selectedDay}
              onAssign={handleAssign}
              busy={assignBusy}
              msg={assignMsg}
            />
          </div>
        </div>
      )}

      {/* Ops calendar */}
      {tab === 'ops' && <OpsCalendar jobs={jobs} />}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
