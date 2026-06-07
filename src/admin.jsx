const { useEffect, useMemo, useState, useCallback } = React

// ── DESIGN TOKENS ─────────────────────────────────────────────
const LINE  = '1px solid #f0f0f0'
const LINE2 = '1px solid #e5e7eb'

const C = {
  bg:         '#ffffff',
  surface:    '#ffffff',
  soft:       '#f9fafb',
  text:       '#111827',
  mid:        '#6b7280',
  light:      '#9ca3af',
  accent:     '#16a34a',
  accentSoft: '#dcfce7',
  accentText: '#14532d',
  warn:       '#d97706',
  warnSoft:   '#fef9c3',
  warnText:   '#78350f',
  danger:     '#dc2626',
  dangerSoft: '#fee2e2',
  dangerText: '#7f1d1d',
  border:     '#f0f0f0',
  borderMid:  '#e5e7eb',
}

const JOB_STATUS = {
  waiting_for_review:         { label: 'Čeká na kontrolu',    dot: C.warn,   pill: C.warnSoft,   text: C.warnText   },
  waiting_for_client_details: { label: 'Čeká na klienta',     dot: C.light,  pill: '#f3f4f6',    text: C.mid        },
  ready_to_offer:             { label: 'Připravena',           dot: C.accent, pill: C.accentSoft, text: C.accentText },
  offered_to_painter:         { label: 'Nabídnuto malíři',    dot: C.warn,   pill: C.warnSoft,   text: C.warnText   },
  painter_accepted:           { label: 'Malíř přijal',        dot: C.accent, pill: C.accentSoft, text: C.accentText },
  confirmed_to_client:        { label: 'Potvrzeno klientovi', dot: C.accent, pill: C.accentSoft, text: C.accentText },
  in_progress:                { label: 'Probíhá',             dot: C.accent, pill: C.accentSoft, text: C.accentText },
  completed:                  { label: 'Dokončeno',            dot: C.light,  pill: '#f3f4f6',    text: C.mid        },
  cancelled:                  { label: 'Zrušeno',              dot: C.danger, pill: C.dangerSoft, text: C.dangerText },
}

const AVAIL_COLOR = { available: C.accent,     limited: C.warn,      unavailable: C.danger }
const AVAIL_BG    = { available: C.accentSoft,  limited: C.warnSoft,  unavailable: C.dangerSoft }
const AVAIL_LABEL = { available: 'Volný',        limited: 'Omezený',   unavailable: 'Obsazený' }

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
  padding: '8px 16px', borderRadius: 8, border: `1px solid ${border}`,
  background: bg, color, fontSize: 13, fontWeight: 500,
  cursor: 'pointer', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap',
})
const ghostBtn = () => btn('#fff', C.mid, LINE2.replace('1px solid ',''))
const primaryBtn = () => btn(C.accent)
const inp = (extra = {}) => ({
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: LINE2, fontSize: 13,
  fontFamily: "'Outfit', sans-serif", outline: 'none',
  boxSizing: 'border-box', background: '#fff', color: C.text, ...extra,
})
function ColHeader({ children }) {
  return <div style={{ padding: '12px 16px', borderBottom: LINE, fontSize: 11, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>{children}</div>
}
function StatusPill({ status }) {
  const s = JOB_STATUS[status] || { label: status, pill: '#f3f4f6', text: C.mid, dot: C.light }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background: s.pill, color: s.text, borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>
      <span style={{ width:5, height:5, borderRadius:99, background:s.dot, display:'inline-block' }} />
      {s.label}
    </span>
  )
}

// ── LOGIN ─────────────────────────────────────────────────────
function Login({ onLogin, loading, error }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f9fafb' }}>
      <div style={{ width: 360, background: '#fff', border: LINE2, borderRadius: 12, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Malíř Hned · Admin</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: C.text, letterSpacing: '-0.02em', margin: '0 0 20px' }}>Přihlášení</h1>
        <div style={{ display: 'grid', gap: 10 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" style={inp()} />
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Heslo" style={inp()} onKeyDown={e => e.key === 'Enter' && onLogin({ email, password: pw })} />
          {error && <div style={{ fontSize: 12, color: C.danger }}>{error}</div>}
          <button onClick={() => onLogin({ email, password: pw })} disabled={loading} style={{ ...primaryBtn(), width:'100%', padding:'10px' }}>{loading ? 'Přihlašuji…' : 'Přihlásit'}</button>
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
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')

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

  const q = search.toLowerCase()
  const allFiltered = jobs
    .filter(j => {
      if (filterStatus === 'active') return !['completed','cancelled'].includes(j.status)
      if (filterStatus === 'done')   return ['completed','cancelled'].includes(j.status)
      return true
    })
    .filter(j => !q || (j.client_name||'').toLowerCase().includes(q) || (j.client_email||'').toLowerCase().includes(q) || (j.client_phone||'').includes(q))
    .sort((a,b) => new Date(a.created_at)-new Date(b.created_at))

  const active = filterStatus === 'active' ? allFiltered : allFiltered.filter(j => !['completed','cancelled'].includes(j.status))
  const closed  = filterStatus !== 'active' ? allFiltered.filter(j => ['completed','cancelled'].includes(j.status)).slice(0,20) : []

  function renderJob(job) {
    const exp = expandedId === job.id
    const detail = details[job.id]
    const f = form[job.id] || {}
    const isActive = activeJobId === job.id
    const s = JOB_STATUS[job.status] || { dot: C.light, label: job.status, pill: '#f3f4f6', text: C.mid }

    return (
      <div key={job.id} style={{ borderBottom: LINE }}>
        <button onClick={() => toggle(job.id)} style={{
          width: '100%', textAlign: 'left', border: 'none', padding: '14px 16px',
          background: isActive ? '#f0fdf4' : '#fff',
          cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
          borderLeft: `3px solid ${isActive ? C.accent : 'transparent'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{job.client_name || 'Klient'}</span>
            <span style={{ fontSize: 11, color: C.light, flexShrink: 0, marginTop: 1 }}>{ago(job.created_at)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <StatusPill status={job.status} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{fmt(job.estimated_client_price_max || job.estimated_price_high)}</span>
          </div>
          {job.preferred_date && (
            <div style={{ fontSize: 12, color: C.light, marginTop: 5 }}>{fmtShort(job.preferred_date)}</div>
          )}
        </button>

        {exp && (
          <div style={{ padding: '14px 16px 16px', background: C.soft, borderTop: LINE }}>
            {!detail
              ? <div style={{ fontSize: 12, color: C.light }}>Načítám…</div>
              : <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 12, marginBottom: 12 }}>
                    {[['Tel', detail.client_phone], ['Mail', detail.client_email],
                      ['Adresa', detail.client_address || detail.locality],
                      ['Práce', detail.work_type],
                      ['Plocha', detail.custom_area ? detail.custom_area+' m²' : null],
                      ['Opravy', detail.repairs]]
                      .filter(([,v]) => v).map(([k,v]) => (
                        <div key={k}>
                          <div style={{ color: C.light, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{k}</div>
                          <div style={{ color: C.text }}>{v}</div>
                        </div>
                      ))}
                  </div>
                  {detail.booking_note && (
                    <div style={{ fontSize: 12, color: C.mid, marginBottom: 12, lineHeight: 1.6, padding: '8px 10px', background: '#fff', borderRadius: 8, border: LINE }}>
                      {detail.booking_note}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: C.mid, marginBottom: 12, padding: '7px 10px', background: '#fff', borderRadius: 8, border: LINE }}>
                    Provize: <strong style={{ color: C.accent }}>{commission(detail.confirmed_client_price || detail.estimated_client_price_max)}</strong>
                  </div>
                  {!['completed','cancelled'].includes(job.status) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                      <input value={f.confirmedPrice||''} onChange={e => setForm(p=>({...p,[job.id]:{...p[job.id],confirmedPrice:e.target.value}}))} placeholder="Cena klientovi" style={inp()} />
                      <input value={f.painterPayout||''} onChange={e => setForm(p=>({...p,[job.id]:{...p[job.id],painterPayout:e.target.value}}))} placeholder="Odměna malíři" style={inp()} />
                    </div>
                  )}
                  {job.preferred_date && !['completed','cancelled'].includes(job.status) && (
                    <button onClick={() => { onSelectJob(job.id, f.confirmedPrice, f.painterPayout); onSetCalDate(job.preferred_date) }}
                      style={{ ...primaryBtn(), width: '100%', padding: '10px', fontSize: 13 }}>
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

  const totalActive = jobs.filter(j => !['completed','cancelled'].includes(j.status)).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ColHeader>Zakázky · {totalActive} aktivních</ColHeader>

      {/* Search + filter */}
      <div style={{ padding: '8px 12px', borderBottom: LINE, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Hledat jméno, e-mail, tel…"
          style={{ ...inp(), fontSize: 12, padding: '7px 10px' }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {[['active','Aktivní'],['done','Uzavřené'],['all','Vše']].map(([k,l]) => (
            <button key={k} onClick={() => setFilterStatus(k)} style={{
              flex: 1, padding: '5px 4px', borderRadius: 7, border: LINE2,
              background: filterStatus===k ? C.text : '#fff',
              color: filterStatus===k ? '#fff' : C.mid,
              fontSize: 11, fontWeight: filterStatus===k ? 600 : 400,
              cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {allFiltered.length === 0 && <div style={{ padding: 32, fontSize: 13, color: C.light, textAlign: 'center' }}>{search ? 'Nic nenalezeno' : 'Žádné zakázky'}</div>}
        {allFiltered.map(renderJob)}
      </div>
    </div>
  )
}

// ── COL 2: MONTHLY CALENDAR ───────────────────────────────────
// 3 status styles — no border, pure background chip
const STATUS_STYLE = {
  available:   { pill: '#dcfce7', text: '#166534', dot: '#22c55e', strike: false },
  limited:     { pill: '#fef9c3', text: '#854d0e', dot: '#eab308', strike: false },
  unavailable: { pill: '#fee2e2', text: '#991b1b', dot: '#ef4444', strike: true  },
  unknown:     { pill: '#f3f4f6', text: '#9ca3af', dot: '#d1d5db', strike: false },
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

  const LINE = '1px solid #f0f0f0'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: LINE, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => setMonthBase(m => addMonths(m, -1))} style={{ background: 'none', border: LINE, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.mid, display:'flex',alignItems:'center',justifyContent:'center' }}>‹</button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600, color: C.text, textTransform: 'capitalize', letterSpacing: '-0.01em' }}>{monthLabel}</span>
        <button onClick={() => setMonthBase(m => addMonths(m, 1))} style={{ background: 'none', border: LINE, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.mid, display:'flex',alignItems:'center',justifyContent:'center' }}>›</button>
        <button onClick={() => setMonthBase(monthOf(today))} style={{ background: 'none', border: LINE, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: C.mid, fontFamily:"'Outfit',sans-serif", fontWeight:500 }}>Dnes</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Day-of-week header row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: LINE }}>
          {['Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota','Neděle'].map((d, i) => (
            <div key={d} style={{
              padding: '10px 12px',
              fontSize: 11, fontWeight: 600,
              color: i >= 5 ? '#94a3b8' : '#9ca3af',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              borderRight: i < 6 ? LINE : 'none',
            }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {Array.from({ length: leading }, (_, i) => (
            <div key={`l${i}`} style={{ borderRight: LINE, borderBottom: LINE, minHeight: 120, background: '#fafafa' }} />
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
                border: 'none',
                borderRight: isLastCol ? 'none' : LINE,
                borderBottom: LINE,
                background: isSelected ? '#f0faf5' : isJobDay ? '#fffbeb' : isWeekend ? '#fafafa' : '#fff',
                boxShadow: isSelected ? `inset 0 0 0 2px ${C.accent}` : isJobDay ? `inset 0 0 0 1.5px ${C.warn}` : 'none',
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                textAlign: 'left',
                opacity: isPast && !isSelected && !isToday ? 0.45 : 1,
                display: 'flex', flexDirection: 'column', gap: 4,
                minHeight: 120,
                transition: 'background 0.1s',
              }}>
                {/* Date number */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{
                    fontSize: 13, fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#fff' : isWeekend ? '#94a3b8' : '#374151',
                    background: isToday ? C.accent : 'transparent',
                    borderRadius: 99,
                    width: isToday ? 26 : 'auto', height: isToday ? 26 : 'auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, lineHeight: 1,
                  }}>{num}</span>
                  {isJobDay && (
                    <span style={{ fontSize: 9, color: C.warn, fontWeight: 700, letterSpacing: '0.04em' }}>TERMÍN</span>
                  )}
                </div>

                {/* Painter chips — no border, pure colored bg */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                  {painters.map((p, pi) => {
                    const status = painterStatuses[pi]
                    const s = STATUS_STYLE[status] || STATUS_STYLE.unknown
                    const firstName = (p.name || p.email || '?').split(' ')[0]
                    return (
                      <div key={pi} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: s.pill,
                        borderRadius: 4,
                        padding: '2px 7px 2px 5px',
                        border: 'none',
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: 99,
                          background: s.dot, flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: 11, fontWeight: 500,
                          color: s.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1, minWidth: 0,
                          textDecoration: s.strike ? 'line-through' : 'none',
                          opacity: s.strike ? 0.55 : 1,
                        }}>{firstName}</span>
                      </div>
                    )
                  })}
                </div>
              </button>
            )
          })}
          {(() => {
            const total = leading + days
            const remainder = total % 7 === 0 ? 0 : 7 - (total % 7)
            return Array.from({ length: remainder }, (_, i) => (
              <div key={`t${i}`} style={{ borderRight: i < remainder - 1 ? LINE : 'none', borderBottom: LINE, minHeight: 120, background: '#fafafa' }} />
            ))
          })()}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, padding: '10px 16px', alignItems: 'center', borderTop: LINE }}>
          {[['available','Volný'],['limited','Nevím jistě'],['unavailable','Obsazený']].map(([k,l]) => {
            const s = STATUS_STYLE[k]
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: s.dot, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{l}</span>
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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <span style={{ fontSize: 13, color: C.light, textAlign: 'center' }}>← Klikněte na den v kalendáři</span>
      </div>
    </div>
  )

  const jobDate = activeJob?.preferred_date
  const isMatchDay = selectedDay === jobDate

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ColHeader>Malíři · {fmtShort(selectedDay)}</ColHeader>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {isMatchDay && activeJob && (
          <div style={{ padding: '10px 16px', background: C.warnSoft, borderBottom: LINE, fontSize: 12, color: C.warnText }}>
            Preferovaný termín: <strong>{activeJob.client_name}</strong>
          </div>
        )}
        {!data && <div style={{ fontSize: 12, color: C.light, padding: '24px 16px', textAlign: 'center' }}>Načítám…</div>}
        {painters.map((p, pi) => {
          const ac = AVAIL_COLOR[p.availability_status] || C.light
          const ab = AVAIL_BG[p.availability_status] || C.soft
          const isSelected = selectedPainterId === p.id
          const hasOverlap = p.block_count > 0

          return (
            <button key={p.id} onClick={() => onSelectPainter(p)} style={{
              width: '100%', textAlign: 'left', padding: '12px 16px',
              border: 'none', borderBottom: LINE,
              borderLeft: `3px solid ${isSelected ? C.accent : 'transparent'}`,
              background: isSelected ? '#f0fdf4' : '#fff',
              cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: ac, flexShrink: 0, display:'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{p.name}</span>
                <span style={{ padding: '2px 8px', borderRadius: 99, background: ab, color: ac, fontSize: 11, fontWeight: 500 }}>
                  {AVAIL_LABEL[p.availability_status] || '—'}
                </span>
              </div>
              <div style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontSize: 11, color: C.light }}>
                  Kapacita: <span style={{ color: C.text }}>{p.remaining_capacity ?? p.capacity ?? '—'}</span>
                  {' · '}
                  {p.accepts_express
                    ? <span style={{ color: C.accent }}>expres ✓</span>
                    : <span style={{ color: C.light }}>bez expresu</span>}
                  {p.reliability_score != null && <span style={{ color: C.mid }}> · ⭐ {p.reliability_score}</span>}
                </div>
                {p.service_areas?.length > 0 && (
                  <div style={{ fontSize: 11, color: C.mid }}>📍 {p.service_areas.join(', ')}</div>
                )}
                {p.work_types?.length > 0 && (
                  <div style={{ fontSize: 11, color: C.mid }}>🖌 {p.work_types.join(', ')}</div>
                )}
                {hasOverlap && <div style={{ fontSize: 11, color: C.danger }}>⚠ {p.block_count} blokace tento den</div>}
                {p.job_fit?.locality_match === false && <div style={{ fontSize: 11, color: C.warn }}>Mimo lokalitu zakázky</div>}
                {p.job_fit?.score != null && <div style={{ fontSize: 11, color: C.mid }}>Skóre shody: {p.job_fit.score}</div>}
                {(p.note || p.painter_note) && <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.4, fontStyle: 'italic' }}>{p.note || p.painter_note}</div>}
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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <span style={{ fontSize: 13, color: C.light, textAlign: 'center', lineHeight: 1.6 }}>Vyberte zakázku<br/>a malíře</span>
      </div>
    </div>
  )

  const isError = msg && (msg.includes('fail') || msg.includes('Chyba'))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ColHeader>Detail &amp; odeslání</ColHeader>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Job summary */}
        {activeJob && (
          <div style={{ padding: '14px 16px', borderBottom: LINE }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Zakázka</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>{activeJob.client_name}</div>
            <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.7 }}>
              <div>{activeJob.client_phone}{activeJob.client_email ? ' · ' + activeJob.client_email : ''}</div>
              <div>{activeJob.client_address || activeJob.locality || '—'}</div>
              <div>{activeJob.work_type}{activeJob.custom_area ? ' · ' + activeJob.custom_area + ' m²' : ''}</div>
            </div>
          </div>
        )}

        {/* Painter summary */}
        {selectedPainter && (
          <div style={{ padding: '14px 16px', borderBottom: LINE }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Malíř</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: AVAIL_COLOR[selectedPainter.availability_status] || C.light, display:'inline-block' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{selectedPainter.name}</span>
              <span style={{ fontSize: 11, color: C.mid }}>{AVAIL_LABEL[selectedPainter.availability_status]}</span>
            </div>
            <div style={{ fontSize: 12, color: C.mid }}>Termín: <strong style={{ color: C.text }}>{fmtLong(selectedDay)}</strong></div>
          </div>
        )}

        {/* Financial summary */}
        {activeJob && (
          <div style={{ padding: '14px 16px', borderBottom: LINE }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Finance</div>
            {[
              ['Cena klientovi', fmt(price)],
              ['Odměna malíři',  fmt(payout)],
              ['Provize (15 %)', fmt(comm)],
            ].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: C.mid }}>{k}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Duration */}
        {selectedPainter && selectedDay && (
          <div style={{ padding: '14px 16px', borderBottom: LINE }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Délka zakázky</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[['1 den',1],['2 dny',2],['3+ dny',3]].map(([label,val]) => (
                <button key={val} onClick={() => setDuration(val)} style={{
                  padding: '9px 4px', borderRadius: 8, fontFamily: "'Outfit', sans-serif", fontSize: 12,
                  border: duration===val ? `1.5px solid ${C.accent}` : LINE2,
                  background: duration===val ? C.accentSoft : '#fff',
                  color: duration===val ? C.accent : C.mid, cursor: 'pointer', fontWeight: duration===val ? 600 : 400,
                }}>{label}</button>
              ))}
            </div>
            {duration > 1 && (
              <div style={{ fontSize: 11, color: C.light, marginTop: 8 }}>
                Obsadí: {Array.from({length:duration},(_,i)=>fmtShort(addDays(selectedDay,i))).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {msg && (
          <div style={{ margin: '12px 16px', padding: '10px 12px', borderRadius: 8, fontSize: 12,
            background: isError ? C.dangerSoft : C.accentSoft,
            color: isError ? C.danger : C.accentText }}>
            {msg}
          </div>
        )}

        {/* Action */}
        {activeJob && selectedPainter && selectedDay && (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.6, padding: '10px 12px', background: C.soft, borderRadius: 8, border: LINE }}>
              📱 Nabídka odejde malíři <strong>{selectedPainter.name}</strong> do telefonu.<br/>
              ✉️ Po přijetí bude <strong>{activeJob.client_email}</strong> informován e-mailem.
            </div>
            <button
              disabled={busy}
              onClick={() => onAssign(selectedPainter, duration)}
              style={{ ...primaryBtn(), width: '100%', padding: '12px', fontSize: 13, borderRadius: 8 }}
            >
              {busy ? 'Odesílám…' : `Odeslat nabídku → ${selectedPainter.name}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── OPS CALENDAR (TAB 2) ──────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

function OpsCalendar({ jobs }) {
  const [month, setMonth] = useState(monthOf(today))
  const [popup, setPopup] = useState(null)
  const winW = useWindowWidth()
  const isMobile = winW < 700

  const monthLabel = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).format(new Date(month + 'T12:00:00Z'))
  const days = daysInMonth(month)
  const leading = firstDow(month)

  // Build job map — spread multi-day jobs across all their dates
  const jobMap = {}
  jobs.forEach(j => {
    const start = j.preferred_date
    if (!start) return
    const dur = j.duration_days || 1
    for (let i = 0; i < dur; i++) {
      const date = addDays(start, i)
      if (!jobMap[date]) jobMap[date] = []
      // Mark continuation days so we can show them differently
      jobMap[date].push({ ...j, _dayIndex: i, _isStart: i === 0, _isCont: i > 0 })
    }
  })

  return (
    <div style={{ overflowY: 'auto', height: 'calc(100vh - 56px)', background: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: LINE }}>
        <button onClick={() => setMonth(m => addMonths(m, -1))} style={{ background:'none', border:LINE2, borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:16, color:C.mid, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 600, color: C.text, textTransform: 'capitalize', flex: 1, textAlign: 'center', letterSpacing:'-0.01em' }}>{monthLabel}</span>
        <button onClick={() => setMonth(m => addMonths(m, 1))} style={{ background:'none', border:LINE2, borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:16, color:C.mid, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
        <button onClick={() => setMonth(monthOf(today))} style={{ background:'none', border:LINE2, borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12, color:C.mid, fontFamily:"'Outfit',sans-serif", fontWeight:500 }}>Dnes</button>
      </div>

      {/* Day headers — desktop only */}
      {!isMobile && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: LINE }}>
        {['Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota','Neděle'].map((d,i) => (
          <div key={d} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: i>=5?'#94a3b8':'#9ca3af', textTransform:'uppercase', letterSpacing:'0.07em', borderRight: i<6?LINE:'none' }}>{d}</div>
        ))}
      </div>}

      {/* Mobile: day list */}
      {isMobile && (
        <div>
          {Array.from({length:days},(_,i) => {
            const num = i + 1
            const date = `${month.slice(0,7)}-${String(num).padStart(2,'0')}`
            const dayJobs = (jobMap[date]||[]).filter(j => j._isStart || !j._isCont || true)
            if (dayJobs.length === 0) return null
            return (
              <div key={date} style={{ borderBottom: LINE, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: date===today ? C.accent : C.mid, marginBottom: 8 }}>
                  {new Intl.DateTimeFormat('cs-CZ',{weekday:'short',day:'numeric',month:'short'}).format(new Date(date+'T12:00'))}
                </div>
                {dayJobs.map(j => {
                  const s = JOB_STATUS[j.status] || {}
                  return (
                    <button key={j.id+'_'+j._dayIndex} onClick={() => setPopup(j)} style={{
                      width:'100%', textAlign:'left', padding:'10px 12px', borderRadius:8, marginBottom:6,
                      background:'#fff', border: LINE, borderLeft:`3px solid ${s.dot||C.light}`,
                      cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                    }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{j.client_name}</div>
                      {j.assigned_painter_name && <div style={{ fontSize:11, color:C.mid }}>{j.assigned_painter_name}</div>}
                      <div style={{ marginTop:4 }}><StatusPill status={j.status} /></div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* Grid — desktop */}
      {!isMobile && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {Array.from({length:leading},(_,i) => (
          <div key={`l${i}`} style={{ borderRight:LINE, borderBottom:LINE, minHeight:140, background:'#fafafa' }} />
        ))}
        {Array.from({length:days},(_,i) => {
          const num = i + 1
          const date = `${month.slice(0,7)}-${String(num).padStart(2,'0')}`
          const dayJobs = jobMap[date] || []
          const isToday = date === today
          const isPast = date < today
          const colIndex = (leading + i) % 7
          const isWeekend = colIndex >= 5
          const isLastCol = colIndex === 6

          return (
            <div key={date} style={{
              minHeight: 140,
              padding: '8px 10px',
              borderRight: isLastCol ? 'none' : LINE,
              borderBottom: LINE,
              background: isWeekend ? '#fafafa' : '#fff',
              boxShadow: isToday ? `inset 0 0 0 2px ${C.accent}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{
                  fontSize: 13, fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#fff' : isPast ? C.light : isWeekend ? '#94a3b8' : C.text,
                  background: isToday ? C.accent : 'transparent',
                  borderRadius: 99, width: isToday ? 26 : 'auto', height: isToday ? 26 : 'auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{num}</span>
                {dayJobs.length > 0 && (
                  <span style={{ fontSize: 10, color: C.light }}>{dayJobs.length} zak.</span>
                )}
              </div>
              {dayJobs.map(j => {
                const s = JOB_STATUS[j.status] || { dot: C.light, label: j.status, pill:'#f3f4f6', text: C.mid }
                const price = j.confirmed_client_price || j.estimated_client_price_max
                const dur = j.duration_days || 1
                return (
                  <button key={j.id + '_' + j._dayIndex} onClick={() => setPopup(j)} style={{
                    width: '100%', textAlign: 'left', padding: '5px 8px 6px',
                    borderRadius: 6, marginBottom: 3,
                    cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    background: j._isCont ? '#f9fafb' : '#fff',
                    border: LINE,
                    borderLeft: `3px solid ${j._isCont ? '#d1d5db' : s.dot}`,
                    display: 'block', opacity: j._isCont ? 0.75 : 1,
                  }}>
                    {j._isCont
                      ? <div style={{ fontSize: 11, color: C.light, fontStyle: 'italic' }}>
                          ↳ {j.client_name} (den {j._dayIndex + 1}/{dur})
                        </div>
                      : <>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom: 2 }}>
                            {j.client_name || 'Klient'}
                            {dur > 1 && <span style={{ fontWeight:400, color:C.light, marginLeft:4 }}>{dur} dny</span>}
                          </div>
                          {j.assigned_painter_name && (
                            <div style={{ fontSize: 11, color: C.mid, marginBottom: 2 }}>{j.assigned_painter_name}</div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                            <span style={{ fontSize: 10, color: C.light, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {j.work_type || j.locality || '—'}
                            </span>
                            {price && <span style={{ fontSize: 11, fontWeight: 600, color: C.text, whiteSpace:'nowrap' }}>{fmt(price)}</span>}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <StatusPill status={j.status} />
                          </div>
                        </>
                    }
                  </button>
                )
              })}
            </div>
          )
        })}
        {(() => {
          const total = leading + days
          const rem = total % 7 === 0 ? 0 : 7 - (total % 7)
          return Array.from({length:rem},(_,i)=>(
            <div key={`t${i}`} style={{ borderRight: i<rem-1?LINE:'none', borderBottom:LINE, minHeight:140, background:'#fafafa' }} />
          ))
        })()}
      </div>}

      {/* Popup */}
      {popup && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'grid', placeItems:'center', padding:20 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(4px)' }} onClick={() => setPopup(null)} />
          <div style={{ position:'relative', width:'100%', maxWidth:440, background:'#fff', borderRadius:12, padding:28, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', border: LINE2 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                {popup.reference && <div style={{ fontSize:11, color:C.light, marginBottom:4 }}>{popup.reference}</div>}
                <h3 style={{ fontSize:20, fontWeight:700, color:C.text, margin:0, letterSpacing:'-0.02em' }}>{popup.client_name}</h3>
              </div>
              <button onClick={() => setPopup(null)} style={{ background:'none', border:LINE2, borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:18, color:C.mid, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
            <div style={{ marginBottom:14 }}><StatusPill status={popup.status} /></div>
            <div style={{ display:'grid', gap:'10px 16px', gridTemplateColumns:'1fr 1fr', fontSize:13, marginBottom:14 }}>
              {[
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
                ['Provize (15 %)', commission(popup.confirmed_client_price || popup.estimated_client_price_max)],
              ].filter(([,v])=>v).map(([k,v]) => (
                <div key={k}>
                  <div style={{ color:C.light, fontSize:10, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:2 }}>{k}</div>
                  <div style={{ color:C.text }}>{v}</div>
                </div>
              ))}
            </div>
            {popup.booking_note && (
              <div style={{ paddingTop:12, borderTop:LINE, fontSize:12, color:C.mid, lineHeight:1.6 }}>{popup.booking_note}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── STATS PANEL ──────────────────────────────────────────────
function StatsPanel({ jobs, painters }) {
  const now = new Date()
  const thisMonth = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)

  const completed = jobs.filter(j => j.status === 'completed')
  const cancelled = jobs.filter(j => j.status === 'cancelled')
  const active    = jobs.filter(j => !['completed','cancelled'].includes(j.status))
  const thisMonthDone = completed.filter(j => (j.preferred_date||j.created_at||'').startsWith(thisMonth))
  const lastMonthDone = completed.filter(j => (j.preferred_date||j.created_at||'').startsWith(lastMonth))

  const totalRevenue = completed.reduce((s,j) => s + (Number(j.confirmed_price)||Number(j.estimated_client_price_max)||0), 0)
  const avgPrice = completed.length ? Math.round(totalRevenue / completed.length) : 0

  const painterStats = painters.map(p => {
    const done = completed.filter(j => j.assigned_painter_id === p.id).length
    const canc = cancelled.filter(j => j.assigned_painter_id === p.id).length
    return { ...p, done, canc }
  }).sort((a,b) => b.done - a.done)

  const stat = (label, value, sub) => (
    <div style={{ background: '#fff', border: LINE2, borderRadius: 12, padding: '20px 24px', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: C.mid, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.light, marginTop: 4 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 32, background: C.soft }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 24, letterSpacing: '-0.02em' }}>Statistiky</div>

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        {stat('Aktivní zakázky', active.length)}
        {stat('Dokončeno celkem', completed.length, `tento měsíc: ${thisMonthDone.length}, minulý: ${lastMonthDone.length}`)}
        {stat('Zrušeno', cancelled.length)}
        {stat('Průměrná cena', avgPrice ? `${avgPrice.toLocaleString('cs')} Kč` : '—')}
        {stat('Odhadovaný obrat', totalRevenue ? `${Math.round(totalRevenue/1000)}k Kč` : '—', 'z dokončených')}
      </div>

      {/* Painter table */}
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Výkon malířů</div>
      <div style={{ background: '#fff', border: LINE2, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px', padding: '8px 16px', background: C.soft, borderBottom: LINE2 }}>
          {['Jméno','Dokončeno','Zrušeno','Spolehlivost'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: C.light, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>
        {painterStats.map((p,i) => (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px', padding: '10px 16px', borderBottom: i < painterStats.length-1 ? LINE : 'none', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{p.name}</div>
            <div style={{ fontSize: 13, color: p.done > 0 ? C.accent : C.light, fontWeight: 600 }}>{p.done}</div>
            <div style={{ fontSize: 13, color: p.canc > 0 ? C.danger : C.light }}>{p.canc}</div>
            <div style={{ fontSize: 12, color: C.mid }}>
              {p.reliability_score != null ? `⭐ ${p.reliability_score}` : '—'}
            </div>
          </div>
        ))}
        {painterStats.length === 0 && (
          <div style={{ padding: '24px 16px', fontSize: 13, color: C.light, textAlign: 'center' }}>Žádná data</div>
        )}
      </div>

      {/* Status breakdown */}
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: '28px 0 12px' }}>Stav zakázek</div>
      <div style={{ background: '#fff', border: LINE2, borderRadius: 12, overflow: 'hidden' }}>
        {Object.entries(JOB_STATUS).map(([k,v], i, arr) => {
          const cnt = jobs.filter(j => j.status === k).length
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < arr.length-1 ? LINE : 'none' }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: v.dot, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ flex: 1, fontSize: 12, color: C.text }}>{v.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: cnt > 0 ? C.text : C.light }}>{cnt}</span>
            </div>
          )
        })}
      </div>
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

  const [toast, setToast] = useState(null)
  const jobsRef = React.useRef(jobs)
  useEffect(() => { jobsRef.current = jobs }, [jobs])

  // Auto-refresh jobs + toast on new arrivals
  useEffect(() => {
    if (!session) return
    const id = setInterval(async () => {
      try {
        const d = await fetch('/api/admin/jobs').then(r => r.json())
        if (!d.jobs) return
        const prev = jobsRef.current
        const newOnes = d.jobs.filter(j => !prev.find(p => p.id === j.id))
        if (newOnes.length > 0) {
          setToast(`${newOnes.length} nová zakázka přišla: ${newOnes.map(j=>j.client_name).join(', ')}`)
          setTimeout(() => setToast(null), 6000)
        }
        setJobs(d.jobs)
      } catch {}
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
      // Refresh jobs + month data immediately
      const [jr] = await Promise.all([
        fetch('/api/admin/jobs').then(r => r.json()),
        fetch(`/api/admin/availability?${new URLSearchParams({from:monthBase,months:'1'})}`).then(r=>r.json()).then(setMonthData),
      ])
      if (jr.jobs) setJobs(jr.jobs)
      // Deselect painter + job to show updated state clearly
      setSelectedPainter(null)
      setActiveJobId(null)
    } catch {
      setAssignMsg('Chyba při odesílání. Zkuste znovu.')
    }
    setAssignBusy(false)
  }

  // ── Resizable columns ─────────────────────────────────────────
  // Layout: [w0=fixed] | H0 | [flex] | H1 | [w2=fixed] | H2 | [w3=fixed]
  // H0: drag right → w0 grows   (flex shrinks automatically)
  // H1: drag right → w2 shrinks (flex grows  automatically) → sign inverted
  // H2: drag right → w2 grows, w3 shrinks (both fixed → change both)
  const [colWidths, setColWidths] = useState({ w0: 300, w2: 240, w3: 300 })

  function makeResizer(applyFn) {
    return function(e) {
      e.preventDefault()
      const startX = e.clientX
      const snapshot = { ...colWidths }

      function onMove(ev) {
        const dx = ev.clientX - startX
        setColWidths(prev => {
          const next = applyFn({ ...prev }, dx, snapshot)
          return next
        })
      }
      function onUp() {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }
  }

  // H0: between col0 (fixed) and flex → w0 changes only
  const onDragH0 = makeResizer((w, dx, snap) => ({
    ...w, w0: Math.max(160, snap.w0 + dx)
  }))
  // H1: between flex and col2 (fixed) → w2 changes, sign inverted
  const onDragH1 = makeResizer((w, dx, snap) => ({
    ...w, w2: Math.max(160, snap.w2 - dx)
  }))
  // H2: between col2 (fixed) and col3 (fixed) → both change
  const onDragH2 = makeResizer((w, dx, snap) => ({
    ...w,
    w2: Math.max(160, snap.w2 + dx),
    w3: Math.max(160, snap.w3 - dx),
  }))

  function ResizeHandle({ onMouseDown }) {
    const [hov, setHov] = useState(false)
    return (
      <div
        onMouseDown={onMouseDown}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ width: 5, flexShrink: 0, cursor: 'col-resize', position: 'relative', zIndex: 10 }}
      >
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: 1, height: '100%',
            background: hov ? C.accent : '#e5e7eb',
            transition: 'background 0.15s',
          }} />
        </div>
      </div>
    )
  }

  if (loading && !session) return <Login onLogin={login} loading={loading} error={loginError} />
  if (!session)             return <Login onLogin={login} loading={loading} error={loginError} />

  const activeCount = jobs.filter(j => !['completed','cancelled'].includes(j.status)).length
  const { w0, w2, w3 } = colWidths

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: LINE }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>Malíř Hned</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[['dispatch', `Dispečink${activeCount ? ` (${activeCount})` : ''}`], ['ops', 'Přehled zakázek'], ['stats', 'Statistiky']].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  padding: '6px 14px', border: 'none', background: tab===key ? C.soft : 'transparent',
                  borderRadius: 8, fontFamily: "'Outfit', sans-serif", fontSize: 13, cursor: 'pointer',
                  color: tab === key ? C.text : C.mid, fontWeight: tab === key ? 600 : 400,
                }}>{label}</button>
              ))}
            </div>
          </div>
          <button onClick={logout} style={{ ...ghostBtn(), fontSize: 12, padding: '6px 12px' }}>Odhlásit</button>
        </div>
      </div>

      {/* Live notification toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, background: C.text, color: '#fff',
          padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: C.accent, display: 'inline-block', flexShrink: 0 }} />
          {toast}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 16, lineHeight: 1, marginLeft: 4 }}>×</button>
        </div>
      )}

      {/* Dispatch tab — 4 resizable columns */}
      {tab === 'dispatch' && (
        <div style={{ flex: 1, display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
          {/* Col 1 */}
          {/* Col 1 — fixed */}
          <div style={{ width: w0, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <JobList jobs={jobs} activeJobId={activeJobId} onSelectJob={handleSelectJob} onSetCalDate={handleSetCalDate} />
          </div>
          <ResizeHandle onMouseDown={onDragH0} />

          {/* Col 2 — flex (calendar) */}
          <div style={{ flex: 1, minWidth: 280, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <MonthCalendar
              selectedDay={selectedDay}
              onSelectDay={date => { setSelectedDay(date); setSelectedPainter(null) }}
              monthBase={monthBase} setMonthBase={setMonthBase}
              monthData={monthData} painters={painters} activeJob={activeJob}
            />
          </div>
          <ResizeHandle onMouseDown={onDragH1} />

          {/* Col 3 — fixed (painters) */}
          <div style={{ width: w2, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <PainterAvail
              selectedDay={selectedDay} dayCache={dayCache} activeJob={activeJob}
              onSelectPainter={p => { setSelectedPainter(p); setAssignMsg('') }}
              selectedPainterId={selectedPainter?.id}
            />
          </div>
          <ResizeHandle onMouseDown={onDragH2} />

          {/* Col 4 — fixed (detail) */}
          <div style={{ width: w3, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <AssignDetail
              activeJob={activeJob} activeJobForm={activeJobForm}
              selectedPainter={selectedPainter} selectedDay={selectedDay}
              onAssign={handleAssign} busy={assignBusy} msg={assignMsg}
            />
          </div>
        </div>
      )}

      {tab === 'ops' && <OpsCalendar jobs={jobs} />}

      {tab === 'stats' && <StatsPanel jobs={jobs} painters={painters} />}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
