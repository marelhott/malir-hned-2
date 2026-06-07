const { useEffect, useMemo, useState } = React

const C = {
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
  dangerSoft: '#fbecea',
  shadow: '0 2px 8px rgba(20,14,6,0.04), 0 24px 64px rgba(20,14,6,0.09)',
}

const STATUS_META = {
  available: { label: 'Volno', bg: C.accentSoft, text: C.accent, dot: C.accent },
  limited:   { label: 'Omezeně', bg: C.warnSoft, text: C.warn, dot: C.warn },
  unavailable:{ label: 'Pryč', bg: C.mutedSoft, text: C.muted, dot: C.muted },
}

const JOB_STATUS_META = {
  new:           { label: 'Nová',              bg: C.warnSoft,   color: C.warn },
  pending_review:{ label: 'Ke zpracování',     bg: C.warnSoft,   color: C.warn },
  in_dispatch:   { label: 'Dispečink',         bg: C.warnSoft,   color: C.warn },
  offer_sent:    { label: 'Nabídka odeslána',  bg: C.warnSoft,   color: C.warn },
  assigned:      { label: 'Přidělena',         bg: C.accentSoft, color: C.accent },
  in_progress:   { label: 'Probíhá',           bg: C.accentSoft, color: C.accent },
  done:          { label: 'Dokončena',         bg: C.mutedSoft,  color: C.muted },
  cancelled:     { label: 'Zrušena',          bg: C.dangerSoft, color: C.danger },
}

const WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

// ── SVG icons ────────────────────────────────────────────────────────────────
function Icon({ name, size = 16, color = 'currentColor' }) {
  const s = { display: 'block', flexShrink: 0 }
  switch (name) {
    case 'calendar':    return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={s}><rect x="1.5" y="2.5" width="13" height="12" rx="2"/><line x1="1.5" y1="6" x2="14.5" y2="6"/><line x1="5" y1="1" x2="5" y2="4"/><line x1="11" y1="1" x2="11" y2="4"/><rect x="4" y="8.5" width="2" height="2" rx="0.4" fill={color} stroke="none"/><rect x="7" y="8.5" width="2" height="2" rx="0.4" fill={color} stroke="none"/><rect x="10" y="8.5" width="2" height="2" rx="0.4" fill={color} stroke="none"/><rect x="4" y="11.5" width="2" height="2" rx="0.4" fill={color} stroke="none"/><rect x="7" y="11.5" width="2" height="2" rx="0.4" fill={color} stroke="none"/></svg>
    case 'briefcase':   return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={s}><rect x="1" y="5" width="14" height="9" rx="2"/><path d="M5 5V3.5A1.5 1.5 0 0 1 6.5 2h3A1.5 1.5 0 0 1 11 3.5V5"/><line x1="1" y1="9" x2="15" y2="9"/></svg>
    case 'inbox':       return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M1 10l2.5-7h9L15 10"/><rect x="1" y="10" width="14" height="4" rx="1.5"/><path d="M5.5 12h5"/></svg>
    case 'pin':         return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M8 1.5C5.8 1.5 4 3.3 4 5.5c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z"/><circle cx="8" cy="5.5" r="1.5"/></svg>
    case 'phone':       return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M3 2h3l1.5 3.5-2 1.2c.8 1.7 2 2.9 3.7 3.7l1.2-2L14 9.5V12.5A1.5 1.5 0 0 1 12.5 14C6 14 2 8 2 3.5A1.5 1.5 0 0 1 3.5 2z"/></svg>
    case 'message':     return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 2 3-2h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/></svg>
    case 'map':         return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={s}><polygon points="1,2 6,4 10,2 15,4 15,14 10,12 6,14 1,12"/><line x1="6" y1="4" x2="6" y2="14"/><line x1="10" y1="2" x2="10" y2="12"/></svg>
    case 'chevron_right': return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="6,4 10,8 6,12"/></svg>
    case 'chevron_left':  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="10,4 6,8 10,12"/></svg>
    case 'check':       return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="2.5,8.5 6.5,12.5 13.5,4"/></svg>
    case 'x':           return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
    case 'clock':       return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="8" cy="8" r="6.5"/><polyline points="8,4.5 8,8 10.5,10"/></svg>
    case 'ruler':       return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={s}><rect x="1" y="5" width="14" height="6" rx="1.5"/><line x1="4" y1="5" x2="4" y2="8"/><line x1="7" y1="5" x2="7" y2="7"/><line x1="10" y1="5" x2="10" y2="8"/><line x1="13" y1="5" x2="13" y2="7"/></svg>
    case 'tag':         return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M8.5 1.5H13a1.5 1.5 0 0 1 1.5 1.5v4.5L8 14 2 8l6.5-6.5z"/><circle cx="11.5" cy="4.5" r="1" fill={color} stroke="none"/></svg>
    case 'note':        return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={s}><rect x="2" y="1.5" width="12" height="13" rx="2"/><line x1="5" y1="5.5" x2="11" y2="5.5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="10.5" x2="8.5" y2="10.5"/></svg>
    case 'send':        return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="14" y1="2" x2="1" y2="8"/><line x1="14" y1="2" x2="9" y2="14"/><line x1="14" y1="2" x2="6" y2="9"/></svg>
    case 'coins':       return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={s}><ellipse cx="6" cy="5" rx="4.5" ry="2"/><path d="M1.5 5v3c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V5"/><ellipse cx="10" cy="10" rx="4.5" ry="2"/><path d="M5.5 10v.5c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V10"/></svg>
    default: return null
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────
function field() {
  return { width: '100%', padding: '11px 12px', borderRadius: 12, border: `1px solid ${C.border}`, background: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }
}

function monthStart(v) { const d = new Date(`${v}T12:00:00Z`); d.setUTCDate(1); return d.toISOString().slice(0, 10) }
function addMonths(v, n) { const d = new Date(`${v}T12:00:00Z`); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10) }
function pad(n) { return String(n).padStart(2, '0') }
function monthLabel(v) { return new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).format(new Date(`${v}T12:00:00Z`)) }
function dayLabel(v) { return new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${v}T12:00:00Z`)) }
function fmtPhone(p) { return p ? p.replace(/\s+/g, '').replace(/^00/, '+') : null }
function mapsUrl(a) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}` }
function fmtCzk(n) { return new Intl.NumberFormat('cs-CZ').format(n) + ' Kč' }

function buildMonthCells(month, availabilityMap) {
  const first = new Date(`${month}T12:00:00Z`)
  const year = first.getUTCFullYear(), mi = first.getUTCMonth()
  const leading = (new Date(Date.UTC(year, mi, 1)).getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(year, mi + 1, 0)).getUTCDate()
  const cells = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let d = 1; d <= days; d++) {
    const date = `${year}-${pad(mi + 1)}-${pad(d)}`
    cells.push({ date, day: d, row: availabilityMap.get(date) || { date, status: 'available', capacity: 1, accepts_express: false, note: '' } })
  }
  while (cells.length % 7) cells.push(null)
  return cells
}

// ── Section screen wrapper ────────────────────────────────────────────────────
function Screen({ title, onBack, children }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 14 }}>
      <div style={{ maxWidth: 430, margin: '0 auto', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, boxShadow: C.shadow, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: `1px solid ${C.border}` }}>
          <button type="button" onClick={onBack}
            style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, flexShrink: 0 }}>
            <Icon name="chevron_left" size={18} color={C.text} />
          </button>
          <div style={{ fontSize: 16, fontWeight: 500, color: C.text }}>{title}</div>
        </div>
        <div style={{ padding: 14 }}>{children}</div>
      </div>
    </div>
  )
}

// ── Kalendář ─────────────────────────────────────────────────────────────────
function KalendarScreen({ onBack, availabilityMap, monthCells, month, setMonth, save, saving, painterNote, setPainterNote, setDetailDate }) {
  return (
    <Screen title="Kalendář" onBack={onBack}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ fontSize: 13, color: C.textMid }}>Zaklikejte dny, kdy můžete pracovat. Detail dne otevřete tapnutím.</div>

        <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, padding: 12, background: C.surfaceSoft }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
            <button type="button" onClick={() => setMonth(p => addMonths(p, -1))}
              style={{ width: 34, height: 34, borderRadius: 999, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chevron_left" size={16} color={C.text} />
            </button>
            <strong style={{ fontSize: 16, color: C.text, textTransform: 'capitalize' }}>{monthLabel(month)}</strong>
            <button type="button" onClick={() => setMonth(p => addMonths(p, 1))}
              style={{ width: 34, height: 34, borderRadius: 999, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chevron_right" size={16} color={C.text} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
            {WEEKDAYS.map(w => <div key={w} style={{ textAlign: 'center', fontSize: 11, color: C.textLight }}>{w}</div>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {monthCells.map((cell, i) => {
              if (!cell) return <div key={`e-${i}`} />
              const meta = STATUS_META[cell.row.status] || STATUS_META.available
              return (
                <button key={cell.date} type="button" onClick={() => setDetailDate(cell.date)}
                  style={{ minHeight: 48, borderRadius: 14, border: `1px solid ${C.border}`, background: meta.bg, color: meta.text, display: 'grid', placeItems: 'center', padding: 6, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{cell.day}</div>
                  <div style={{ width: 5, height: 5, borderRadius: 999, background: meta.dot }} />
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {Object.entries(STATUS_META).map(([k, m]) => (
              <div key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 999, background: m.bg, color: m.text, fontSize: 11 }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: m.dot, display: 'inline-block' }} />
                {m.label}
              </div>
            ))}
          </div>
        </div>

        <BulkAvailability availabilityMap={availabilityMap} onSave={save} saving={saving} />

        <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Zpráva pro dispečink</div>
          <textarea value={painterNote} onChange={e => setPainterNote(e.target.value)} placeholder="Např. tento týden jen menší zakázky."
            style={{ ...field(), minHeight: 88, resize: 'vertical' }} />
          <button type="button" onClick={() => save({ painterNote }, 'note')}
            style={{ marginTop: 8, width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', background: C.accent, color: '#fff', fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="send" size={14} color="#fff" />
            {saving === 'note' ? 'Ukládám…' : 'Uložit zprávu'}
          </button>
        </div>
      </div>
    </Screen>
  )
}

// ── BulkAvailability ─────────────────────────────────────────────────────────
function BulkAvailability({ availabilityMap, onSave, saving }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('unavailable')
  const [done, setDone] = useState(false)
  const SC = { available: { bg: C.accentSoft, color: C.accent }, limited: { bg: C.warnSoft, color: C.warn }, unavailable: { bg: C.mutedSoft, color: C.muted } }
  const SL = { available: 'Volno', limited: 'Omezeně', unavailable: 'Pryč' }

  async function apply() {
    if (!from || !to || from > to) return
    const entries = [], cur = new Date(`${from}T12:00:00Z`), end = new Date(`${to}T12:00:00Z`)
    while (cur <= end) {
      const date = cur.toISOString().slice(0, 10)
      const ex = availabilityMap.get(date) || {}
      entries.push({ date, status, capacity: status === 'unavailable' ? 0 : (ex.capacity ?? 1), accepts_express: ex.accepts_express ?? false, note: ex.note || '', source: 'painter' })
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
    const ok = await onSave({ entries }, 'bulk')
    if (ok) { setDone(true); setTimeout(() => setDone(false), 2000) }
  }

  const fs = { padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.border}`, background: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: 13, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Nastavit blok dnů</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div><div style={{ fontSize: 11, color: C.textLight, marginBottom: 4 }}>Od</div><input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ ...fs, width: '100%' }} /></div>
        <div><div style={{ fontSize: 11, color: C.textLight, marginBottom: 4 }}>Do</div><input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ ...fs, width: '100%' }} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
        {Object.entries(SL).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setStatus(k)}
            style={{ padding: '9px 6px', borderRadius: 12, border: `1px solid ${status === k ? SC[k].color : C.border}`, background: status === k ? SC[k].bg : '#fff', color: status === k ? SC[k].color : C.textMid, fontFamily: "'Outfit', sans-serif", fontSize: 12, cursor: 'pointer' }}>
            {l}
          </button>
        ))}
      </div>
      <button type="button" onClick={apply} disabled={!from || !to || saving === 'bulk'}
        style={{ width: '100%', padding: '11px 12px', borderRadius: 12, border: 'none', background: C.accent, color: '#fff', fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', opacity: (!from || !to) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {saving === 'bulk' ? 'Ukládám…' : done ? <><Icon name="check" size={14} color="#fff" />Uloženo</> : 'Použít na výběr'}
      </button>
    </div>
  )
}

// ── Zakázky screen ────────────────────────────────────────────────────────────
function ZakazkyScreen({ jobs, onBack }) {
  const [selected, setSelected] = useState(null)
  const active = jobs.filter(j => j.status === 'assigned' || j.status === 'in_progress')
  const done = jobs.filter(j => j.status !== 'assigned' && j.status !== 'in_progress')

  if (selected) return <JobDetail job={selected} onClose={() => setSelected(null)} onBack={onBack} />

  function Card({ job }) {
    const meta = JOB_STATUS_META[job.status] || { label: job.status, bg: C.mutedSoft, color: C.muted }
    const addr = job.client_address || job.address || job.service_area || job.locality || '—'
    return (
      <button type="button" onClick={() => setSelected(job)}
        style={{ width: '100%', textAlign: 'left', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{job.client_name || 'Zákazník'}</div>
          <span style={{ padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: meta.bg, color: meta.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{meta.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textMid, fontSize: 13, marginBottom: 6 }}>
          <Icon name="pin" size={13} color={C.textLight} />{addr}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textLight, fontSize: 12 }}>
            {job.preferred_date_label && <><Icon name="calendar" size={12} color={C.textLight} />{job.preferred_date_label}</>}
          </div>
          {job.painter_reward != null && <div style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>{fmtCzk(job.painter_reward)}</div>}
        </div>
      </button>
    )
  }

  return (
    <Screen title="Zakázky" onBack={onBack}>
      {jobs.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: C.textLight }}><Icon name="briefcase" size={22} /></div>
          <div style={{ fontSize: 15, color: C.textMid }}>Zatím žádné zakázky</div>
          <div style={{ fontSize: 13, color: C.textLight, marginTop: 6 }}>Přidělené zakázky se zobrazí zde</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {active.length > 0 && <>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4, marginBottom: 2 }}>Aktivní</div>
            {active.map(j => <Card key={j.id} job={j} />)}
          </>}
          {done.length > 0 && <>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: active.length ? 10 : 4, marginBottom: 2 }}>Dokončené</div>
            {done.map(j => <Card key={j.id} job={j} />)}
          </>}
        </div>
      )}
    </Screen>
  )
}

// ── Job detail (full screen) ──────────────────────────────────────────────────
function JobDetail({ job, onClose, onBack }) {
  const addr = job.client_address || job.address || ''
  const area = job.service_area || job.locality || ''
  const phone = fmtPhone(job.client_phone)
  const meta = JOB_STATUS_META[job.status] || { label: job.status, bg: C.mutedSoft, color: C.muted }

  function Row({ icon, label, children, accent }) {
    return (
      <div style={{ display: 'flex', gap: 12, paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ marginTop: 1, color: C.textLight, flexShrink: 0 }}><Icon name={icon} size={14} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.textLight, marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 14, color: accent ? C.accent : C.text, fontWeight: accent ? 600 : 400 }}>{children}</div>
        </div>
      </div>
    )
  }

  return (
    <Screen title={job.client_name || 'Detail zakázky'} onBack={onClose}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            {job.reference && <div style={{ fontSize: 12, color: C.textLight }}>{job.reference}</div>}
          </div>
          <span style={{ padding: '5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: meta.bg, color: meta.color }}>{meta.label}</span>
        </div>

        {phone && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <a href={`tel:${phone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 12px', borderRadius: 14, background: C.accent, color: '#fff', textDecoration: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500 }}>
              <Icon name="phone" size={15} color="#fff" />Volat
            </a>
            <a href={`sms:${phone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 12px', borderRadius: 14, border: `1px solid ${C.border}`, background: C.surfaceSoft, color: C.accent, textDecoration: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500 }}>
              <Icon name="message" size={15} color={C.accent} />SMS
            </a>
          </div>
        )}

        {addr && (
          <a href={mapsUrl(addr)} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: `1px solid ${C.border}`, background: C.surfaceSoft, textDecoration: 'none', marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
            <Icon name="map" size={18} color={C.accent} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{addr}</div>
              <div style={{ fontSize: 11, color: C.accent, marginTop: 2 }}>Otevřít v Google Maps</div>
            </div>
            <Icon name="chevron_right" size={16} color={C.textLight} />
          </a>
        )}

        {phone && <Row icon="phone" label="Telefon"><a href={`tel:${phone}`} style={{ color: C.accent, textDecoration: 'none' }}>{job.client_phone}</a></Row>}
        {job.preferred_date_label && <Row icon="calendar" label="Termín">{job.preferred_date_label}</Row>}
        {job.preferred_time_label && <Row icon="clock" label="Čas">{job.preferred_time_label}</Row>}
        {job.work_type && <Row icon="tag" label="Typ práce">{job.work_type}</Row>}
        {(job.custom_area || job.area_m2) && <Row icon="ruler" label="Plocha">{job.custom_area || job.area_m2} m²</Row>}
        {area && area !== addr && <Row icon="pin" label="Oblast">{area}</Row>}
        {job.painter_reward != null && <Row icon="coins" label="Vaše odměna" accent>{fmtCzk(job.painter_reward)}</Row>}
        {job.confirmed_price != null && <Row icon="coins" label="Cena pro zákazníka">{fmtCzk(job.confirmed_price)}</Row>}
        {job.client_note && <Row icon="note" label="Poznámka zákazníka"><span style={{ fontStyle: 'italic', color: C.textMid }}>„{job.client_note}"</span></Row>}
      </div>
    </Screen>
  )
}

// ── Nabídky screen ────────────────────────────────────────────────────────────
function NabidkyScreen({ offers, respondingId, respondOffer, onBack }) {
  const pending = offers.filter(o => o.status === 'pending')
  const past = offers.filter(o => o.status !== 'pending')
  // per-offer estimated days state: { [offerId]: string }
  const [daysMap, setDaysMap] = useState({})
  const [daysError, setDaysError] = useState({})

  function setDays(offerId, val) {
    setDaysMap(p => ({ ...p, [offerId]: val }))
    setDaysError(p => ({ ...p, [offerId]: false }))
  }

  function handleAccept(offerToken, offerId) {
    const d = parseInt(daysMap[offerId] || '', 10)
    if (!d || d < 1) { setDaysError(p => ({ ...p, [offerId]: true })); return }
    respondOffer(offerToken, 'accepted', d)
  }

  return (
    <Screen title="Nabídky" onBack={onBack}>
      <div style={{ display: 'grid', gap: 14 }}>
        {pending.length === 0 && past.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: C.textLight }}><Icon name="inbox" size={22} /></div>
            <div style={{ fontSize: 15, color: C.textMid }}>Žádné nabídky</div>
            <div style={{ fontSize: 13, color: C.textLight, marginTop: 6 }}>Nové nabídky se zobrazí zde</div>
          </div>
        )}

        {pending.length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Čeká na reakci</div>
            {pending.map(offer => {
              const job = offer.job || {}
              const loc = job.service_area || job.locality || offer.approx_location || '—'
              const addr = job.client_address || job.address || ''
              const payout = offer.offered_payout || offer.offered_reward

              function DetailRow({ icon, label, value }) {
                if (!value) return null
                return (
                  <div style={{ display: 'flex', gap: 10, paddingBottom: 11, marginBottom: 11, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ color: C.textLight, flexShrink: 0, marginTop: 1 }}><Icon name={icon} size={13} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: C.textLight, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, color: C.text }}>{value}</div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={offer.id} style={{ border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
                  {/* offer header */}
                  <div style={{ padding: '14px 16px 14px', borderBottom: `1px solid ${C.border}`, background: C.warnSoft }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.warn, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Nová nabídka</div>

                    {/* date — prominent */}
                    {(job.preferred_date_label || job.preferred_time_label) && (
                      <div style={{ background: '#fff', border: `1px solid ${C.warn}55`, borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon name="calendar" size={18} color={C.warn} />
                        <div>
                          {job.preferred_date_label && <div style={{ fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>{job.preferred_date_label}</div>}
                          {job.preferred_time_label && <div style={{ fontSize: 13, color: C.textMid, marginTop: 2 }}>{job.preferred_time_label}</div>}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{loc}</div>
                        {addr && addr !== loc && <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>{addr}</div>}
                      </div>
                      {payout && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 11, color: C.textMid, marginBottom: 2 }}>Vaše odměna</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: C.accent, letterSpacing: '-0.02em' }}>{fmtCzk(payout)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* job details */}
                  <div style={{ padding: '14px 16px 4px' }}>
                    <DetailRow icon="tag"      label="Typ práce" value={job.work_type} />
                    <DetailRow icon="ruler"    label="Plocha" value={(job.custom_area || job.area_m2) ? `${job.custom_area || job.area_m2} m²` : null} />
                    <DetailRow icon="pin"      label="Oblast" value={loc !== addr ? null : loc} />
                    {job.repairs != null && (
                      <DetailRow icon="note" label="Opravy omítky" value={job.repairs ? 'Ano' : 'Ne'} />
                    )}
                    {job.client_note && (
                      <div style={{ paddingBottom: 11, marginBottom: 11, borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div style={{ color: C.textLight, flexShrink: 0, marginTop: 1 }}><Icon name="note" size={13} /></div>
                          <div>
                            <div style={{ fontSize: 11, color: C.textLight, marginBottom: 4 }}>Poznámka zákazníka</div>
                            <div style={{ fontSize: 13, color: C.textMid, fontStyle: 'italic', lineHeight: 1.5 }}>„{job.client_note}"</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* days input + action buttons */}
                  {offer.offer_token && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: C.textLight, marginBottom: 6 }}>
                          Počet dní potřebných na realizaci
                          <span style={{ color: C.danger }}> *</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: `1px solid ${daysError[offer.id] ? C.danger : C.border}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                          <button type="button"
                            onClick={() => setDays(offer.id, String(Math.max(1, (parseInt(daysMap[offer.id] || '1', 10) || 1) - 1)))}
                            style={{ width: 42, height: 44, border: 'none', borderRight: `1px solid ${C.border}`, background: 'transparent', fontSize: 20, color: C.textMid, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            −
                          </button>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <input
                              type="number" min="1" max="30"
                              value={daysMap[offer.id] || ''}
                              onChange={e => setDays(offer.id, e.target.value)}
                              placeholder="—"
                              style={{ width: '100%', border: 'none', outline: 'none', textAlign: 'center', fontSize: 16, fontWeight: 600, color: C.text, fontFamily: "'Outfit', sans-serif", padding: '0 4px', background: 'transparent', height: 44, boxSizing: 'border-box' }}
                            />
                          </div>
                          <button type="button"
                            onClick={() => setDays(offer.id, String(Math.min(30, (parseInt(daysMap[offer.id] || '0', 10) || 0) + 1)))}
                            style={{ width: 42, height: 44, border: 'none', borderLeft: `1px solid ${C.border}`, background: 'transparent', fontSize: 20, color: C.textMid, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            +
                          </button>
                        </div>
                        {daysError[offer.id] && (
                          <div style={{ fontSize: 12, color: C.danger, marginTop: 5 }}>Zadejte počet dní před přijetím.</div>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button type="button" disabled={!!respondingId} onClick={() => handleAccept(offer.offer_token, offer.id)}
                          style={{ padding: '12px 12px', borderRadius: 12, border: 'none', background: C.accent, color: '#fff', fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', opacity: respondingId ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 500 }}>
                          <Icon name="check" size={15} color="#fff" />
                          {respondingId === offer.offer_token + 'accepted' ? 'Ukládám…' : 'Přijmout'}
                        </button>
                        <button type="button" disabled={!!respondingId} onClick={() => respondOffer(offer.offer_token, 'declined')}
                          style={{ padding: '12px 12px', borderRadius: 12, border: `1px solid ${C.border}`, background: '#fff', color: C.danger, fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', opacity: respondingId ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <Icon name="x" size={15} color={C.danger} />
                          {respondingId === offer.offer_token + 'declined' ? 'Ukládám…' : 'Odmítnout'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {past.length > 0 && (
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Historie</div>
            {past.map(offer => {
              const sm = { accepted: { label: 'Přijatá', bg: C.accentSoft, color: C.accent }, declined: { label: 'Odmítnutá', bg: C.mutedSoft, color: C.muted }, expired: { label: 'Prošlá', bg: C.mutedSoft, color: C.muted }, withdrawn: { label: 'Stažená', bg: C.mutedSoft, color: C.muted } }[offer.status] || { label: offer.status, bg: C.mutedSoft, color: C.muted }
              const loc = offer.approx_location || offer.job?.service_area || offer.job?.locality || '—'
              const payout = offer.offered_payout || offer.offered_reward
              return (
                <div key={offer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '11px 14px', border: `1px solid ${C.border}`, borderRadius: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>{loc}</div>
                    {payout && <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{fmtCzk(payout)}</div>}
                  </div>
                  <span style={{ padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: sm.bg, color: sm.color, whiteSpace: 'nowrap' }}>{sm.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Screen>
  )
}

// ── Home screen ───────────────────────────────────────────────────────────────
function HomeScreen({ painter, offers, jobs, onNav, error }) {
  const pending = offers.filter(o => o.status === 'pending').length
  const activeJobs = jobs.filter(j => j.status === 'assigned' || j.status === 'in_progress').length

  const sections = [
    {
      id: 'nabidky',
      icon: 'inbox',
      label: 'Nabídky',
      sub: pending > 0 ? `${pending} čeká na reakci` : offers.length > 0 ? 'Žádné nové nabídky' : 'Žádné nabídky',
      badge: pending || null,
      badgeColor: C.warn,
      highlight: pending > 0,
    },
    {
      id: 'kalendar',
      icon: 'calendar',
      label: 'Kalendář',
      sub: 'Dostupnost a volné termíny',
      badge: null,
    },
    {
      id: 'zakazky',
      icon: 'briefcase',
      label: 'Zakázky',
      sub: activeJobs > 0 ? `${activeJobs} aktivní zakázk${activeJobs === 1 ? 'a' : activeJobs < 5 ? 'y' : 'í'}` : jobs.length > 0 ? `${jobs.length} celkem` : 'Žádné zakázky',
      badge: activeJobs || null,
      badgeColor: C.accent,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 14 }}>
      <div style={{ maxWidth: 430, margin: '0 auto' }}>

        {/* header card */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, boxShadow: C.shadow, padding: '22px 20px 20px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Portál malíře</div>
          <div style={{ fontSize: 28, fontWeight: 400, color: C.text, letterSpacing: '-0.04em' }}>{painter?.name || 'Malíř'}</div>
          {error && <div style={{ fontSize: 12, color: C.danger, marginTop: 8 }}>{error}</div>}
        </div>

        {/* section buttons */}
        <div style={{ display: 'grid', gap: 8 }}>
          {sections.map(s => (
            <button key={s.id} type="button" onClick={() => onNav(s.id)}
              style={{ width: '100%', textAlign: 'left', background: s.highlight ? C.warnSoft : C.surface, border: `1px solid ${s.highlight ? C.warn + '55' : C.border}`, borderRadius: 18, padding: '18px 20px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", boxShadow: C.shadow, display: 'flex', alignItems: 'center', gap: 16 }}>

              {/* icon box */}
              <div style={{ width: 44, height: 44, borderRadius: 13, background: s.highlight ? C.warn + '18' : C.surfaceSoft, border: `1px solid ${s.highlight ? C.warn + '40' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={s.icon} size={20} color={s.highlight ? C.warn : C.textMid} />
              </div>

              {/* text */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: s.highlight ? C.warn : C.textMid }}>{s.sub}</div>
              </div>

              {/* badge or arrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {s.badge ? (
                  <span style={{ minWidth: 22, height: 22, borderRadius: 999, background: s.badgeColor, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{s.badge}</span>
                ) : null}
                <Icon name="chevron_right" size={16} color={C.textLight} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Day detail bottom sheet ───────────────────────────────────────────────────
function DaySheet({ detailDate, draft, setDraft, saving, saveDay, onClose }) {
  return (
    <div role="button" tabIndex={0} onClick={onClose} onKeyDown={e => { if (e.key === 'Escape') onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,14,6,0.36)', display: 'grid', alignItems: 'end', padding: 10, zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '22px 22px 0 0', padding: 18, boxShadow: C.shadow, maxWidth: 430, width: '100%', margin: '0 auto' }}>
        <div style={{ width: 36, height: 3, borderRadius: 999, background: C.border, margin: '0 auto 16px' }} />
        <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Detail dne</div>
        <div style={{ fontSize: 20, color: C.text, letterSpacing: '-0.04em', marginBottom: 16 }}>{dayLabel(detailDate)}</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {Object.entries(STATUS_META).map(([v, m]) => (
            <button key={v} type="button" onClick={() => setDraft(p => ({ ...p, status: v }))}
              style={{ padding: '11px 8px', borderRadius: 14, border: `1px solid ${draft.status === v ? m.dot : C.border}`, background: draft.status === v ? m.bg : '#fff', color: draft.status === v ? m.text : C.textMid, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <input type="number" min="0" value={draft.capacity ?? 1} onChange={e => setDraft(p => ({ ...p, capacity: e.target.value }))} placeholder="Kapacita na den" style={field()} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.text }}>
            <input type="checkbox" checked={Boolean(draft.accepts_express)} onChange={e => setDraft(p => ({ ...p, accepts_express: e.target.checked }))} />
            Bere expresní zakázky
          </label>
          <textarea value={draft.note || ''} onChange={e => setDraft(p => ({ ...p, note: e.target.value }))} placeholder="Poznámka k tomuto dni" style={{ ...field(), minHeight: 84, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
          <button type="button" onClick={onClose} style={{ ...field(), cursor: 'pointer', textAlign: 'center' }}>Zavřít</button>
          <button type="button" onClick={saveDay} style={{ padding: '11px 12px', borderRadius: 12, border: 'none', background: C.accent, color: '#fff', fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>
            {saving === draft.date ? 'Ukládám…' : 'Uložit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [])
  const [state, setState] = useState({ loading: true, error: '', painter: null, availability: [] })
  const [offers, setOffers] = useState([])
  const [jobs, setJobs] = useState([])
  const [saving, setSaving] = useState('')
  const [painterNote, setPainterNote] = useState('')
  const [month, setMonth] = useState(monthStart(new Date().toISOString().slice(0, 10)))
  const [detailDate, setDetailDate] = useState('')
  const [draft, setDraft] = useState(null)
  const [respondingId, setRespondingId] = useState('')
  const [screen, setScreen] = useState('home') // 'home' | 'nabidky' | 'kalendar' | 'zakazky'

  async function load() {
    const r = await fetch(`/api/painter/portal?token=${encodeURIComponent(token)}`)
    const d = await r.json()
    if (!r.ok) { setState({ loading: false, error: d.error || 'Portál se nepodařilo načíst.', painter: null, availability: [] }); return }
    setPainterNote(d.painter?.notes || '')
    setOffers(d.offers || [])
    setJobs(d.jobs || [])
    setState({ loading: false, error: '', painter: d.painter, availability: d.availability || [] })
  }

  useEffect(() => { load() }, [token])

  const availabilityMap = useMemo(() => new Map((state.availability || []).map(r => [r.date, r])), [state.availability])
  const monthCells = useMemo(() => buildMonthCells(month, availabilityMap), [month, availabilityMap])

  useEffect(() => {
    if (!detailDate) return
    const base = availabilityMap.get(detailDate) || { date: detailDate, status: 'available', capacity: 1, accepts_express: false, note: '' }
    setDraft({ date: detailDate, status: base.status || 'available', capacity: base.capacity ?? 1, accepts_express: Boolean(base.accepts_express), note: base.note || '' })
  }, [detailDate, availabilityMap])

  async function save(payload, savingKey) {
    setSaving(savingKey)
    const r = await fetch('/api/painter/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...payload }) })
    const d = await r.json()
    setSaving('')
    if (!r.ok) { setState(p => ({ ...p, error: d.error || 'Uložení se nepodařilo.' })); return false }
    setPainterNote(d.painter?.notes || '')
    setState(p => ({ ...p, error: '', painter: d.painter, availability: d.availability || p.availability }))
    return true
  }

  async function respondOffer(offerToken, decision, estimatedDays) {
    setRespondingId(offerToken + decision)
    const r = await fetch('/api/painter/respond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: offerToken, decision, estimatedDays: estimatedDays || null }) })
    const d = await r.json()
    setRespondingId('')
    if (!r.ok) { setState(p => ({ ...p, error: d.error || 'Reakci se nepodařilo uložit.' })); return }
    load()
  }

  async function saveDay() {
    if (!draft?.date) return
    const ok = await save({ entries: [{ date: draft.date, status: draft.status, capacity: draft.capacity, accepts_express: draft.accepts_express, note: draft.note, source: 'painter' }] }, draft.date)
    if (ok) setDetailDate('')
  }

  if (state.loading) {
    return <div style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center', color: C.textMid, fontFamily: "'Outfit', sans-serif", fontSize: 14 }}>Načítám…</div>
  }

  return (
    <>
      {screen === 'home' && (
        <HomeScreen painter={state.painter} offers={offers} jobs={jobs} error={state.error} onNav={setScreen} />
      )}
      {screen === 'nabidky' && (
        <NabidkyScreen offers={offers} respondingId={respondingId} respondOffer={respondOffer} onBack={() => setScreen('home')} />
      )}
      {screen === 'kalendar' && (
        <KalendarScreen
          onBack={() => setScreen('home')}
          availabilityMap={availabilityMap} monthCells={monthCells}
          month={month} setMonth={setMonth}
          save={save} saving={saving}
          painterNote={painterNote} setPainterNote={setPainterNote}
          setDetailDate={setDetailDate}
        />
      )}
      {screen === 'zakazky' && (
        <ZakazkyScreen jobs={jobs} onBack={() => setScreen('home')} />
      )}

      {detailDate && draft && (
        <DaySheet detailDate={detailDate} draft={draft} setDraft={setDraft} saving={saving} saveDay={saveDay} onClose={() => setDetailDate('')} />
      )}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
