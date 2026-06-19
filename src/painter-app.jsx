const { useEffect, useMemo, useRef, useState } = React

const C = {
  bg: '#f4f5f7',
  surface: '#ffffff',
  surfaceMuted: '#f7f8fa',
  border: '#e7e9ee',
  text: '#17181c',
  textMid: '#69707d',
  textLight: '#9aa2af',
  accent: '#0f1115',
  accentSoft: '#e9f2ff',
  accentBlue: '#2f80ed',
  success: '#22b45a',
  successSoft: '#e9fbf0',
  danger: '#ff4d4f',
  dangerSoft: '#fff0f0',
  warn: '#f6a623',
  warnSoft: '#fff7e8',
  shadow: '0 10px 30px rgba(16, 24, 40, 0.06)',
}

const DONE_STATUSES = ['completed', 'done', 'cancelled']
const ACTIVE_JOB_STATUSES = ['assigned', 'painter_accepted', 'confirmed_to_client', 'in_progress']
const WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

const JOB_STATUS_META = {
  new: { label: 'Nová', tone: 'muted' },
  pending_review: { label: 'Ke zpracování', tone: 'muted' },
  waiting_for_review: { label: 'Ke zpracování', tone: 'muted' },
  waiting_for_client_details: { label: 'Čeká na klienta', tone: 'muted' },
  ready_to_offer: { label: 'Připravena', tone: 'muted' },
  in_dispatch: { label: 'Dispečink', tone: 'muted' },
  offered_to_painter: { label: 'Nabídka odeslána', tone: 'warn' },
  offer_sent: { label: 'Nabídka odeslána', tone: 'warn' },
  painter_accepted: { label: 'Přijatá', tone: 'success' },
  assigned: { label: 'Přidělena', tone: 'success' },
  confirmed_to_client: { label: 'Potvrzená', tone: 'success' },
  in_progress: { label: 'Probíhá', tone: 'blue' },
  completed: { label: 'Dokončená', tone: 'success' },
  done: { label: 'Dokončená', tone: 'success' },
  cancelled: { label: 'Zrušená', tone: 'danger' },
}

function toneStyles(tone) {
  switch (tone) {
    case 'success':
      return { bg: C.successSoft, color: C.success, border: '#c9f0d7' }
    case 'danger':
      return { bg: C.dangerSoft, color: C.danger, border: '#ffd5d5' }
    case 'warn':
      return { bg: C.warnSoft, color: C.warn, border: '#ffe1a8' }
    case 'blue':
      return { bg: '#ebf3ff', color: C.accentBlue, border: '#cfe0ff' }
    default:
      return { bg: '#f3f4f6', color: C.textMid, border: '#e6e8ec' }
  }
}

function availabilityTone(status) {
  if (status === 'available' || status === 'limited') return { bg: C.success, label: 'Volno' }
  if (status === 'unavailable') return { bg: C.danger, label: 'Nedostupný' }
  return { bg: '#eef1f5', label: 'Neoznačeno' }
}

function fieldStyle(extra = {}) {
  return {
    width: '100%',
    padding: '13px 14px',
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    background: '#fff',
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
    ...extra,
  }
}

function panelStyle(extra = {}) {
  return {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 24,
    boxShadow: C.shadow,
    ...extra,
  }
}

function pad(n) { return String(n).padStart(2, '0') }

function monthStart(v) {
  const d = new Date(`${v}T12:00:00Z`)
  d.setUTCDate(1)
  return d.toISOString().slice(0, 10)
}

function addMonths(v, n) {
  const d = new Date(`${v}T12:00:00Z`)
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}

function monthTitle(v) {
  return new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).format(new Date(`${v}T12:00:00Z`))
}

function shortDate(v) {
  if (!v) return '—'
  return new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(`${v}T12:00:00Z`))
}

function fullDayLabel(v) {
  if (!v) return '—'
  return new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${v}T12:00:00Z`))
}

function fmtPhone(p) { return p ? p.replace(/\s+/g, '').replace(/^00/, '+') : null }
function mapsUrl(a) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}` }
function fmtCzk(n) { return new Intl.NumberFormat('cs-CZ').format(n || 0) + ' Kč' }

function jobRef(job) {
  if (job?.reference) return job.reference
  if (job?.id) return `#${String(job.id).slice(0, 6)}`
  return 'Bez reference'
}

function getJobStatusMeta(status) {
  const meta = JOB_STATUS_META[status] || { label: status || 'Neznámý stav', tone: 'muted' }
  return { ...meta, ...toneStyles(meta.tone) }
}

function buildMonthCells(month, availabilityMap, assignedDates) {
  const first = new Date(`${month}T12:00:00Z`)
  const year = first.getUTCFullYear()
  const monthIndex = first.getUTCMonth()
  const leading = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7
  const totalDays = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const cells = []

  for (let i = 0; i < leading; i++) cells.push(null)

  for (let day = 1; day <= totalDays; day++) {
    const date = `${year}-${pad(monthIndex + 1)}-${pad(day)}`
    cells.push({
      date,
      day,
      row: availabilityMap.get(date) || { date, status: 'unknown', capacity: 0, accepts_express: false, note: '', source: null },
      assigned: assignedDates.has(date),
    })
  }

  while (cells.length % 7) cells.push(null)
  return cells
}

function extractAssignedDate(job) {
  return job?.preferred_date || ''
}

function pageWrap(children, tab, onTabChange) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', position: 'relative', paddingBottom: 92 }}>
        {children}
        <BottomTabs tab={tab} onChange={onTabChange} />
      </div>
    </div>
  )
}

function Icon({ name, size = 20, color = 'currentColor', stroke = 1.8 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style: { display: 'block', flexShrink: 0 } }
  switch (name) {
    case 'projects':
      return <svg {...props}><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>
    case 'calendar':
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/></svg>
    case 'profile':
      return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M5 20c1.8-3.5 11.2-3.5 14 0"/></svg>
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>
    case 'check':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>
    case 'pin':
      return <svg {...props}><path d="M12 21s-6-5.2-6-11a6 6 0 0 1 12 0c0 5.8-6 11-6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>
    case 'phone':
      return <svg {...props}><path d="M6 4h4l1.5 4-2.5 1.5c1.6 3 3.9 5.3 6.9 6.9L17.5 14 21 15.5V19a2 2 0 0 1-2 2C10.7 21 3 13.3 3 5a2 2 0 0 1 2-2Z"/></svg>
    case 'message':
      return <svg {...props}><path d="M5 6h14v9H9l-4 3V6Z"/></svg>
    case 'map':
      return <svg {...props}><path d="M9 18 3 20V6l6-2 6 2 6-2v14l-6 2-6-2Z"/><path d="M9 4v14"/><path d="M15 6v14"/></svg>
    case 'arrow-left':
      return <svg {...props}><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></svg>
    case 'chevron-right':
      return <svg {...props}><path d="m10 7 5 5-5 5"/></svg>
    case 'logout':
      return <svg {...props}><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/><path d="m14 16 4-4-4-4"/><path d="M18 12H9"/></svg>
    case 'bell':
      return <svg {...props}><path d="M12 4a4 4 0 0 0-4 4c0 4-1.5 5.5-1.5 5.5h11S16 12 16 8a4 4 0 0 0-4-4"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>
    case 'document':
      return <svg {...props}><path d="M8 3h6l5 5v13H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5"/><path d="M10 13h6"/><path d="M10 17h4"/></svg>
    case 'wallet':
      return <svg {...props}><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M16 12h5"/><circle cx="16" cy="12" r="1"/></svg>
    case 'brush':
      return <svg {...props}><path d="m14 6 4 4"/><path d="M4 20c2 0 4-1 4-3a2 2 0 0 0-2-2c-2 0-3 2-3 3 0 1.2.8 2 1 2Z"/><path d="M13 7 6 14"/></svg>
    default:
      return null
  }
}

function TopBar({ title, subtitle, back, onBack, actions }) {
  return (
    <div style={{ padding: '18px 18px 14px', background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {back ? (
          <button type="button" onClick={onBack} style={{ width: 42, height: 42, borderRadius: 14, border: `1px solid ${C.border}`, background: C.surfaceMuted, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <Icon name="arrow-left" size={18} color={C.text} />
          </button>
        ) : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          {subtitle ? <div style={{ fontSize: 11, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 4 }}>{subtitle}</div> : null}
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.03em' }}>{title}</div>
        </div>
        {actions}
      </div>
    </div>
  )
}

function BottomTabs({ tab, onChange }) {
  const tabs = [
    { id: 'projects', label: 'Zakázky', icon: 'projects' },
    { id: 'availability', label: 'Dostupnost', icon: 'clock' },
    { id: 'profile', label: 'Profil', icon: 'profile' },
  ]

  return (
    <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 0, width: '100%', maxWidth: 430, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${C.border}`, padding: '10px 14px calc(10px + env(safe-area-inset-bottom))', zIndex: 40 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {tabs.map(item => {
          const active = tab === item.id
          return (
            <button key={item.id} type="button" onClick={() => onChange(item.id)}
              style={{ border: 'none', background: active ? '#eaf3ff' : 'transparent', color: active ? C.accentBlue : C.textMid, borderRadius: 16, padding: '10px 8px', fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>
              <div style={{ display: 'grid', placeItems: 'center', gap: 6 }}>
                <Icon name={item.icon} size={22} color={active ? C.accentBlue : C.textMid} />
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 500 }}>{item.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 10, marginBottom: 20 }}>
      {options.map(option => {
        const active = value === option.id
        return (
          <button key={option.id} type="button" onClick={() => onChange(option.id)}
            style={{ border: `1px solid ${active ? C.accent : C.border}`, background: active ? C.accent : C.surface, color: active ? '#fff' : C.text, borderRadius: 999, padding: '12px 14px', fontFamily: "'Outfit', sans-serif", fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name={option.icon} size={17} color={active ? '#fff' : C.text} stroke={2} />
            <span style={{ fontWeight: 600 }}>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function EmptyState({ icon, title, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '52px 22px', color: C.textMid }}>
      <div style={{ width: 64, height: 64, borderRadius: 22, background: C.surface, border: `1px solid ${C.border}`, display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
        <Icon name={icon} size={26} color={C.textLight} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 15, lineHeight: 1.65 }}>{text}</div>
    </div>
  )
}

function OrderCard({ title, subtitle, badge, badgeTone, dateLabel, address, note, amount, onClick }) {
  const tone = toneStyles(badgeTone)
  return (
    <button type="button" onClick={onClick}
      style={{ width: '100%', textAlign: 'left', ...panelStyle({ padding: 18, cursor: 'pointer' }), fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: C.surfaceMuted, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="document" size={24} color={C.textLight} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{title}</div>
              <div style={{ fontSize: 15, color: C.textMid, marginTop: 4 }}>{subtitle}</div>
            </div>
            <span style={{ padding: '7px 10px', borderRadius: 12, background: tone.bg, color: tone.color, border: `1px solid ${tone.border}`, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{badge}</span>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.textMid, fontSize: 15 }}>
              <Icon name="calendar" size={18} color={C.textLight} />
              <span>{dateLabel || 'Termín bude doplněn'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: C.textMid, fontSize: 15 }}>
              <Icon name="pin" size={18} color={C.textLight} />
              <span style={{ lineHeight: 1.5 }}>{address || 'Adresa bude doplněna'}</span>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 15, color: C.text }}>{note}</div>
            {amount ? <div style={{ fontSize: 15, fontWeight: 800, color: C.accentBlue }}>{amount}</div> : null}
          </div>
        </div>
      </div>
    </button>
  )
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 13, color: C.textLight, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{children}</div>
}

function ProjectsScreen({ offers, jobs, mode, setMode, onOpenItem, onTabChange }) {
  const pendingOffers = offers.filter(offer => offer.status === 'pending')
  const completedOffers = offers.filter(offer => offer.status !== 'pending')
  const activeJobs = jobs.filter(job => !DONE_STATUSES.includes(job.status))
  const completedJobs = jobs.filter(job => DONE_STATUSES.includes(job.status))

  return pageWrap(
    <>
      <TopBar title="Zakázky" subtitle="Malířský portál" />
      <div style={{ padding: 18 }}>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { id: 'active', label: 'Aktivní', icon: 'clock' },
            { id: 'completed', label: 'Dokončené', icon: 'check' },
          ]}
        />

        {mode === 'active' ? (
          <>
            {pendingOffers.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <SectionTitle>Nové nabídky</SectionTitle>
                <div style={{ display: 'grid', gap: 14 }}>
                  {pendingOffers.map(offer => {
                    const job = offer.job || {}
                    const title = `Nabídka ${jobRef(job)}`
                    const subtitle = job.client_name || job.service_area || job.locality || 'Nová zakázka'
                    const address = job.client_address || job.address || offer.approx_location || job.service_area || 'Lokalita bude doplněna'
                    return (
                      <OrderCard
                        key={offer.id}
                        title={title}
                        subtitle={subtitle}
                        badge="Čeká na reakci"
                        badgeTone="warn"
                        dateLabel={[job.preferred_date_label, job.preferred_time_label].filter(Boolean).join(' • ')}
                        address={address}
                        note="Dispečink ti poslal novou zakázku ke schválení"
                        amount={offer.offered_payout ? fmtCzk(offer.offered_payout) : null}
                        onClick={() => onOpenItem({ kind: 'offer', offer, job })}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <SectionTitle>Potvrzené a rozpracované</SectionTitle>
              {activeJobs.length === 0 ? (
                <EmptyState icon="projects" title="Žádné aktivní zakázky" text="Jakmile ti dispečink potvrdí zakázku, objeví se tady." />
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {activeJobs.map(job => {
                    const meta = getJobStatusMeta(job.status)
                    const title = `Zakázka ${jobRef(job)}`
                    const subtitle = job.client_name || 'Zákazník'
                    const address = job.client_address || job.address || job.service_area || job.locality || 'Adresa bude doplněna'
                    return (
                      <OrderCard
                        key={job.id}
                        title={title}
                        subtitle={subtitle}
                        badge={meta.label}
                        badgeTone={meta.tone}
                        dateLabel={[job.preferred_date_label, job.preferred_time_label].filter(Boolean).join(' • ')}
                        address={address}
                        note={job.status === 'in_progress' ? 'Zakázka právě probíhá' : 'Zakázka je potvrzená a čeká na realizaci'}
                        amount={job.painter_reward != null ? fmtCzk(job.painter_reward) : null}
                        onClick={() => onOpenItem({ kind: 'job', job })}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div>
            <SectionTitle>Historie</SectionTitle>
            {completedJobs.length === 0 && completedOffers.length === 0 ? (
              <EmptyState icon="check" title="Zatím nic dokončeného" text="Dokončené zakázky a uzavřené nabídky se zobrazí tady." />
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {completedJobs.map(job => {
                  const meta = getJobStatusMeta(job.status)
                  return (
                    <OrderCard
                      key={job.id}
                      title={`Zakázka ${jobRef(job)}`}
                      subtitle={job.client_name || 'Zákazník'}
                      badge={meta.label}
                      badgeTone={meta.tone}
                      dateLabel={[job.preferred_date_label, job.preferred_time_label].filter(Boolean).join(' • ')}
                      address={job.client_address || job.address || job.service_area || job.locality || 'Adresa bude doplněna'}
                      note={job.status === 'cancelled' ? 'Zakázka byla zrušena' : 'Zakázka je uzavřená'}
                      amount={job.painter_reward != null ? fmtCzk(job.painter_reward) : null}
                      onClick={() => onOpenItem({ kind: 'job', job })}
                    />
                  )
                })}
                {completedOffers.map(offer => {
                  const statusMeta = {
                    accepted: { label: 'Přijatá', tone: 'success' },
                    declined: { label: 'Odmítnutá', tone: 'muted' },
                    expired: { label: 'Propadlá', tone: 'muted' },
                    withdrawn: { label: 'Stažená', tone: 'muted' },
                  }[offer.status] || { label: offer.status, tone: 'muted' }
                  const job = offer.job || {}
                  return (
                    <OrderCard
                      key={offer.id}
                      title={`Nabídka ${jobRef(job)}`}
                      subtitle={job.client_name || job.service_area || job.locality || 'Zakázka'}
                      badge={statusMeta.label}
                      badgeTone={statusMeta.tone}
                      dateLabel={[job.preferred_date_label, job.preferred_time_label].filter(Boolean).join(' • ')}
                      address={job.client_address || job.address || offer.approx_location || 'Adresa bude doplněna'}
                      note="Uzavřená nabídka v historii"
                      amount={offer.offered_payout ? fmtCzk(offer.offered_payout) : null}
                      onClick={() => onOpenItem({ kind: 'offer', offer, job })}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>,
    'projects',
    onTabChange
  )
}

function CalendarLegendItem({ color, title, subtitle }) {
  return (
    <div style={{ ...panelStyle({ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 14 }) }}>
      <div style={{ width: 22, height: 22, borderRadius: 8, background: color, marginTop: 4, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.6 }}>{subtitle}</div>
      </div>
    </div>
  )
}

function AvailabilityScreen({ month, setMonth, monthCells, onOpenDay, painterNote, setPainterNote, save, saving, onTabChange }) {
  return pageWrap(
    <>
      <TopBar title="Dostupnost" subtitle="Kalendář" />
      <div style={{ padding: 18 }}>
        <div style={{ ...panelStyle({ padding: 18, marginBottom: 20 }) }}>
          <div style={{ fontSize: 11, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: 6 }}>Vybraný měsíc</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
            <button type="button" onClick={() => setMonth(prev => addMonths(prev, -1))}
              style={{ width: 42, height: 42, borderRadius: 14, border: `1px solid ${C.border}`, background: C.surfaceMuted, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Icon name="arrow-left" size={18} color={C.text} />
            </button>
            <div style={{ fontSize: 30, fontWeight: 800, color: C.text, letterSpacing: '-0.04em', textTransform: 'capitalize' }}>{monthTitle(month)}</div>
            <button type="button" onClick={() => setMonth(prev => addMonths(prev, 1))}
              style={{ width: 42, height: 42, borderRadius: 14, border: `1px solid ${C.border}`, background: C.surfaceMuted, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Icon name="chevron-right" size={18} color={C.text} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 10 }}>
            {WEEKDAYS.map(day => (
              <div key={day} style={{ textAlign: 'center', fontSize: 12, color: C.textLight, fontWeight: 700 }}>{day}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {monthCells.map((cell, index) => {
              if (!cell) return <div key={`empty-${index}`} />
              const baseTone = availabilityTone(cell.row.status)
              const background = cell.assigned ? C.accentBlue : baseTone.bg
              const color = cell.assigned ? '#ffffff' : cell.row.status === 'unknown' ? C.textLight : '#ffffff'
              const opacity = cell.row.status === 'unknown' && !cell.assigned ? 1 : 1
              return (
                <button key={cell.date} type="button" onClick={() => onOpenDay(cell)}
                  style={{ minHeight: 48, borderRadius: 14, border: cell.row.status === 'unknown' && !cell.assigned ? `1px solid ${C.border}` : 'none', background, color, opacity, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800 }}>
                  {cell.day}
                </button>
              )
            })}
          </div>

          <div style={{ fontSize: 14, color: C.textMid, marginTop: 14 }}>Klepnutím na den otevřeš detail a nastavíš jeho stav.</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <SectionTitle>Legenda stavů</SectionTitle>
          <div style={{ display: 'grid', gap: 12 }}>
            <CalendarLegendItem color={C.success} title="Volno" subtitle="Můžeš přijmout novou zakázku." />
            <CalendarLegendItem color={C.danger} title="Nedostupný" subtitle="Nepracuješ nebo nechceš být v tento den nabízený." />
            <CalendarLegendItem color={C.accentBlue} title="Zakázka přiřazena" subtitle="Na tento den už máš potvrzenou nebo rozpracovanou zakázku." />
          </div>
        </div>

        <div style={{ ...panelStyle({ padding: 18 }) }}>
          <div style={{ fontSize: 11, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: 8 }}>Vzkaz pro dispečink</div>
          <textarea
            value={painterNote}
            onChange={(e) => setPainterNote(e.target.value)}
            placeholder="Např. tento týden jen menší zakázky nebo jen Praha."
            style={fieldStyle({ minHeight: 92, resize: 'vertical', marginBottom: 12 })}
          />
          <button type="button" onClick={() => save({ painterNote }, 'note')}
            style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: 'none', background: C.accentBlue, color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {saving === 'note' ? 'Ukládám…' : 'Uložit vzkaz'}
          </button>
        </div>
      </div>
    </>,
    'availability',
    onTabChange
  )
}

function ProfileScreen({ painter, pushState, onPushToggle, onLogout, painterNote, onTabChange }) {
  return pageWrap(
    <>
      <TopBar title="Profil" subtitle="Účet malíře" />
      <div style={{ padding: 18, display: 'grid', gap: 16 }}>
        <div style={{ ...panelStyle({ padding: 22 }) }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: '-0.04em', marginBottom: 10 }}>{painter?.name || 'Malíř'}</div>
          <div style={{ fontSize: 16, color: C.textMid, lineHeight: 1.6 }}>
            {painter?.id ? `ID ${painter.id}` : 'Interní profil malíře'}
          </div>
          {painter?.slug ? <div style={{ fontSize: 14, color: C.textLight, marginTop: 8 }}>/maliri/{painter.slug}</div> : null}
        </div>

        <div style={{ ...panelStyle({ padding: 18 }) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Push notifikace</div>
              <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.6 }}>
                {pushState === 'granted'
                  ? 'Zapnuté. Nové nabídky ti mohou přijít i mimo otevřenou aplikaci.'
                  : pushState === 'denied'
                  ? 'Vypnuté v prohlížeči. Povolení je potřeba změnit ručně.'
                  : 'Zapni si upozornění na nové nabídky.'}
              </div>
            </div>
            {pushState !== 'unsupported' ? (
              <button type="button" onClick={onPushToggle}
                style={{ width: 48, height: 48, borderRadius: 16, border: `1px solid ${pushState === 'granted' ? '#cfe0ff' : C.border}`, background: pushState === 'granted' ? '#eaf3ff' : C.surfaceMuted, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Icon name="bell" size={22} color={pushState === 'granted' ? C.accentBlue : C.textMid} />
              </button>
            ) : null}
          </div>
        </div>

        <div style={{ ...panelStyle({ padding: 18 }) }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8 }}>Poznámka pro dispečink</div>
          <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7 }}>
            {painterNote ? `Aktuálně uložený vzkaz: ${painterNote}` : 'Zatím nemáš uložený žádný vzkaz pro dispečink.'}
          </div>
        </div>

        <button type="button" onClick={onLogout}
          style={{ ...panelStyle({ padding: 18, cursor: 'pointer' }), width: '100%', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff4f4', borderColor: '#ffdede' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 16, background: '#ffe9e9', display: 'grid', placeItems: 'center' }}>
              <Icon name="logout" size={20} color={C.danger} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.danger }}>Odhlásit se</div>
              <div style={{ fontSize: 14, color: '#c46f6f' }}>Ukončí přihlášení v této aplikaci</div>
            </div>
          </div>
          <Icon name="chevron-right" size={18} color={C.danger} />
        </button>
      </div>
    </>,
    'profile',
    onTabChange
  )
}

function DetailRow({ icon, label, value, accent }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 22, display: 'grid', placeItems: 'start', paddingTop: 2, flexShrink: 0 }}>
        <Icon name={icon} size={18} color={C.textLight} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: C.textLight, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 15, color: accent ? C.accentBlue : C.text, lineHeight: 1.55, fontWeight: accent ? 800 : 500 }}>{value}</div>
      </div>
    </div>
  )
}

function OrderDetailScreen({ item, respondingId, respondOffer, onBack, onTabChange }) {
  const isOffer = item?.kind === 'offer'
  const offer = item?.offer || null
  const job = item?.job || null
  const statusMeta = isOffer ? { label: 'Čeká na reakci', tone: 'warn', ...toneStyles('warn') } : getJobStatusMeta(job?.status)
  const address = job?.client_address || job?.address || job?.service_area || job?.locality || ''
  const phone = fmtPhone(job?.client_phone)
  const [estimatedDays, setEstimatedDays] = useState('1')
  const [daysError, setDaysError] = useState('')

  function handleAccept() {
    const days = parseInt(estimatedDays, 10)
    if (!days || days < 1) {
      setDaysError('Zadej počet dní realizace.')
      return
    }
    setDaysError('')
    respondOffer(offer.id, 'accepted', days)
  }

  return pageWrap(
    <>
      <TopBar title={isOffer ? `Nabídka ${jobRef(job)}` : `Zakázka ${jobRef(job)}`} back onBack={onBack} />
      <div style={{ padding: 18, display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ ...panelStyle({ padding: 16 }) }}>
            <div style={{ fontSize: 12, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 8 }}>Zákazník</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: C.text, lineHeight: 1.25 }}>{job?.client_name || 'Zákazník bude doplněn'}</div>
          </div>
          <div style={{ ...panelStyle({ padding: 16, background: isOffer ? C.success : '#1faa4b', color: '#fff', border: 'none' }) }}>
            <div style={{ fontSize: 12, opacity: 0.88, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 8 }}>
              {isOffer ? 'Nabízená odměna' : 'Vaše odměna'}
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.25 }}>
              {offer?.offered_payout != null ? fmtCzk(offer.offered_payout) : job?.painter_reward != null ? fmtCzk(job.painter_reward) : 'Bude doplněna'}
            </div>
          </div>
        </div>

        <div style={{ ...panelStyle({ padding: 18 }) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <div style={{ fontSize: 13, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Detail zakázky</div>
            <span style={{ padding: '7px 10px', borderRadius: 12, background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.border}`, fontSize: 12, fontWeight: 700 }}>{statusMeta.label}</span>
          </div>

          <DetailRow icon="pin" label="Adresa" value={address || 'Adresa bude doplněna'} />
          <DetailRow icon="calendar" label="Termín" value={[job?.preferred_date_label, job?.preferred_time_label].filter(Boolean).join(' • ') || (job?.preferred_date ? shortDate(job.preferred_date) : null)} />
          <DetailRow icon="brush" label="Typ práce" value={job?.work_type || null} />
          <DetailRow icon="wallet" label="Cena pro zákazníka" value={job?.confirmed_price != null ? fmtCzk(job.confirmed_price) : null} />
          <DetailRow icon="projects" label="Plocha" value={job?.custom_area || job?.area_m2 ? `${job.custom_area || job.area_m2} m²` : null} />
          <DetailRow icon="document" label="Poznámka zákazníka" value={job?.client_note || (offer?.sanitized_note || null)} />
        </div>

        {!isOffer && phone ? (
          <a href={`tel:${phone}`} style={{ ...panelStyle({ padding: 18, textDecoration: 'none', background: '#eef5ff', borderColor: '#d3e3ff' }), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: C.accentBlue, fontSize: 16, fontWeight: 800 }}>
            <Icon name="phone" size={20} color={C.accentBlue} />
            Zavolat zákazníkovi
          </a>
        ) : null}

        {!isOffer && address ? (
          <a href={mapsUrl(address)} target="_blank" rel="noreferrer" style={{ ...panelStyle({ padding: 18, textDecoration: 'none' }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 16, background: C.surfaceMuted, display: 'grid', placeItems: 'center' }}>
                <Icon name="map" size={20} color={C.accentBlue} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Otevřít trasu</div>
                <div style={{ fontSize: 14, color: C.textMid }}>Spustí Google Maps s adresou zakázky</div>
              </div>
            </div>
            <Icon name="chevron-right" size={18} color={C.textLight} />
          </a>
        ) : null}

        {isOffer ? (
          <div style={{ ...panelStyle({ padding: 18 }) }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Rozhodnutí k nabídce</div>
            <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.65, marginBottom: 14 }}>
              Když nabídku přijmeš, odešle se dispečinku tvoje reakce a počet dnů potřebných na realizaci.
            </div>
            <input
              type="number"
              min="1"
              max="30"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              placeholder="Počet dní realizace"
              style={fieldStyle({ marginBottom: 8 })}
            />
            {daysError ? <div style={{ fontSize: 13, color: C.danger, marginBottom: 10 }}>{daysError}</div> : null}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button type="button" disabled={Boolean(respondingId)} onClick={handleAccept}
                style={{ padding: '14px 16px', borderRadius: 16, border: 'none', background: C.success, color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: respondingId ? 0.7 : 1 }}>
                {respondingId === offer.id + 'accepted' ? 'Ukládám…' : 'Přijmout'}
              </button>
              <button type="button" disabled={Boolean(respondingId)} onClick={() => respondOffer(offer.id, 'declined')}
                style={{ padding: '14px 16px', borderRadius: 16, border: `1px solid ${C.border}`, background: '#fff', color: C.danger, fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: respondingId ? 0.7 : 1 }}>
                {respondingId === offer.id + 'declined' ? 'Ukládám…' : 'Odmítnout'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>,
    'projects',
    onTabChange
  )
}

function DaySheet({ cell, draft, setDraft, saveDay, saving, onClose }) {
  if (!cell) return null
  const locked = cell.assigned
  return (
    <div role="button" tabIndex={0} onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.32)', display: 'grid', alignItems: 'end', zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '26px 26px 0 0', padding: 18, maxWidth: 430, width: '100%', margin: '0 auto' }}>
        <div style={{ width: 44, height: 4, borderRadius: 999, background: '#d8dde6', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 12, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: 6 }}>Vybraný den</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.04em', marginBottom: 16, textTransform: 'capitalize' }}>{fullDayLabel(cell.date)}</div>

        {locked ? (
          <div style={{ ...panelStyle({ padding: 16, background: '#edf4ff', borderColor: '#d6e4ff' }), marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.accentBlue, marginBottom: 4 }}>Na tento den už máš přiřazenou zakázku</div>
            <div style={{ fontSize: 14, color: '#5878b2', lineHeight: 1.6 }}>Stav dostupnosti se tady ručně nepřepisuje, protože ho blokuje potvrzená nebo probíhající zakázka.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <button type="button" onClick={() => setDraft(prev => ({ ...prev, status: 'available', capacity: 1 }))}
                style={{ padding: '14px 12px', borderRadius: 16, border: `1px solid ${draft.status === 'available' ? '#bfe7cc' : C.border}`, background: draft.status === 'available' ? C.successSoft : '#fff', color: draft.status === 'available' ? C.success : C.textMid, fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                Volno
              </button>
              <button type="button" onClick={() => setDraft(prev => ({ ...prev, status: 'unavailable', capacity: 0 }))}
                style={{ padding: '14px 12px', borderRadius: 16, border: `1px solid ${draft.status === 'unavailable' ? '#ffc7c7' : C.border}`, background: draft.status === 'unavailable' ? C.dangerSoft : '#fff', color: draft.status === 'unavailable' ? C.danger : C.textMid, fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                Nedostupný
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.text, marginBottom: 12 }}>
              <input type="checkbox" checked={Boolean(draft.accepts_express)} onChange={(e) => setDraft(prev => ({ ...prev, accepts_express: e.target.checked }))} />
              Bere expresní zakázky
            </label>

            <textarea
              value={draft.note || ''}
              onChange={(e) => setDraft(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Poznámka k tomuto dni"
              style={fieldStyle({ minHeight: 86, resize: 'vertical', marginBottom: 12 })}
            />

            <button type="button" onClick={saveDay}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: 'none', background: C.accentBlue, color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
              {saving === 'day' ? 'Ukládám…' : 'Uložit den'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function LoginScreen({ painter, pin, setPin, submitting, error, onSubmit }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 18, display: 'grid', placeItems: 'center', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 430, ...panelStyle({ overflow: 'hidden' }) }}>
        <div style={{ padding: '26px 22px 18px', background: '#ffffff' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: '#eef5ff', color: C.accentBlue, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <Icon name="profile" size={14} color={C.accentBlue} />
            Přihlášení PINem
          </div>
          <h1 style={{ margin: '16px 0 8px', fontSize: 30, lineHeight: 1.05, color: C.text, letterSpacing: '-0.05em' }}>Portál malíře</h1>
          <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.6 }}>
            {painter?.name ? <>Přihlášení pro <strong style={{ color: C.text }}>{painter.name}</strong>.</> : 'Přihlášení do malířského portálu.'}
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ padding: 22 }}>
          <div style={{ fontSize: 12, color: C.textLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Šestimístný PIN</div>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D+/g, '').slice(0, 6))}
            placeholder="123456"
            style={fieldStyle({ textAlign: 'center', fontSize: 28, letterSpacing: '0.24em', fontWeight: 800, marginBottom: 12 })}
          />

          {error ? <div style={{ padding: '12px 14px', borderRadius: 14, background: C.dangerSoft, color: C.danger, fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{error}</div> : null}

          <button type="submit" disabled={submitting || pin.length < 6}
            style={{ width: '100%', padding: '15px 16px', borderRadius: 16, border: 'none', background: C.accent, color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: submitting || pin.length < 6 ? 0.65 : 1 }}>
            {submitting ? 'Přihlašuji…' : 'Přihlásit se'}
          </button>

          <div style={{ fontSize: 13, color: C.textLight, lineHeight: 1.65, marginTop: 14 }}>
            Po otevření své adresy se přihlásíš jen PINem. Odkaz už není potřeba posílat znovu.
          </div>
        </form>
      </div>
    </div>
  )
}

function ChangePinScreen({ painter, newPin, setNewPin, confirmPin, setConfirmPin, submitting, error, onSubmit, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 18, display: 'grid', placeItems: 'center', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 430, ...panelStyle({ overflow: 'hidden' }) }}>
        <div style={{ padding: '26px 22px 18px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: '#eef5ff', color: C.accentBlue, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <Icon name="profile" size={14} color={C.accentBlue} />
            První přihlášení
          </div>
          <h1 style={{ margin: '16px 0 8px', fontSize: 30, lineHeight: 1.05, color: C.text, letterSpacing: '-0.05em' }}>Nastav si vlastní PIN</h1>
          <div style={{ fontSize: 15, color: C.textMid, lineHeight: 1.6 }}>
            {painter?.name ? <>Dočasný PIN pro <strong style={{ color: C.text }}>{painter.name}</strong> už nebudeš dál používat.</> : 'Před vstupem si nastav vlastní PIN.'}
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ padding: 22, display: 'grid', gap: 12 }}>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            pattern="[0-9]*"
            maxLength={6}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D+/g, '').slice(0, 6))}
            placeholder="Nový PIN"
            style={fieldStyle({ textAlign: 'center', fontSize: 24, letterSpacing: '0.22em', fontWeight: 800 })}
          />
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            pattern="[0-9]*"
            maxLength={6}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D+/g, '').slice(0, 6))}
            placeholder="Potvrzení PINu"
            style={fieldStyle({ textAlign: 'center', fontSize: 24, letterSpacing: '0.22em', fontWeight: 800 })}
          />

          {error ? <div style={{ padding: '12px 14px', borderRadius: 14, background: C.dangerSoft, color: C.danger, fontSize: 14, lineHeight: 1.6 }}>{error}</div> : null}

          <button type="submit" disabled={submitting || newPin.length < 6 || confirmPin.length < 6}
            style={{ width: '100%', padding: '15px 16px', borderRadius: 16, border: 'none', background: C.accent, color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: submitting || newPin.length < 6 || confirmPin.length < 6 ? 0.65 : 1 }}>
            {submitting ? 'Ukládám…' : 'Uložit nový PIN'}
          </button>

          <button type="button" onClick={onLogout}
            style={{ width: '100%', padding: '15px 16px', borderRadius: 16, border: `1px solid ${C.border}`, background: '#fff', color: C.textMid, fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
            Odhlásit se
          </button>
        </form>
      </div>
    </div>
  )
}

function App() {
  const slug = useMemo(() => {
    const match = location.pathname.match(/\/maliri\/([^/?#]+)/)
    return match ? decodeURIComponent(match[1]) : ''
  }, [])

  const [state, setState] = useState({ loading: true, error: '', painter: null, availability: [] })
  const [offers, setOffers] = useState([])
  const [jobs, setJobs] = useState([])
  const [saving, setSaving] = useState('')
  const [painterNote, setPainterNote] = useState('')
  const [month, setMonth] = useState(monthStart(new Date().toISOString().slice(0, 10)))
  const [tab, setTab] = useState('projects')
  const [projectMode, setProjectMode] = useState('active')
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null)
  const [draft, setDraft] = useState(null)
  const [respondingId, setRespondingId] = useState('')
  const [pushState, setPushState] = useState('unknown')
  const [pin, setPin] = useState('')
  const [authRequired, setAuthRequired] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [mustChangePin, setMustChangePin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinChangeError, setPinChangeError] = useState('')
  const [pinChangeSubmitting, setPinChangeSubmitting] = useState(false)
  const swReg = useRef(null)

  function changeTab(nextTab) {
    setSelectedItem(null)
    setTab(nextTab)
  }

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported')
      return
    }
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      swReg.current = reg
      setPushState(Notification.permission)
    }).catch(() => setPushState('unsupported'))
  }, [])

  async function load() {
    if (!slug) {
      setState({ loading: false, error: 'Chybí adresa malíře. Otevři stránku ve tvaru /maliri/jmeno.', painter: null, availability: [] })
      return
    }

    const response = await fetch(`/api/painter/portal?slug=${encodeURIComponent(slug)}`)
    const data = await response.json()

    if (response.status === 401) {
      setOffers([])
      setJobs([])
      setPainterNote('')
      setAuthRequired(true)
      setMustChangePin(false)
      setAuthError('')
      setState({ loading: false, error: '', painter: data.painter || null, availability: [] })
      return
    }

    if (!response.ok) {
      setState({ loading: false, error: data.error || 'Portál se nepodařilo načíst.', painter: null, availability: [] })
      return
    }

    setAuthRequired(false)
    setMustChangePin(Boolean(data.painter?.must_change_pin))
    setAuthError('')
    setPainterNote(data.painter?.notes || '')
    setOffers(data.offers || [])
    setJobs(data.jobs || [])
    setState({ loading: false, error: '', painter: data.painter, availability: data.availability || [] })
  }

  async function loginPainter(e) {
    e?.preventDefault?.()
    setAuthSubmitting(true)
    setAuthError('')
    const response = await fetch('/api/painter/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, pin }),
    })
    const data = await response.json()
    setAuthSubmitting(false)
    if (!response.ok) {
      setAuthError(data.error || 'Přihlášení se nepodařilo.')
      return
    }

    setPin('')
    setAuthRequired(false)
    setMustChangePin(Boolean(data.painter?.must_change_pin))
    setPinChangeError('')
    setPainterNote(data.painter?.notes || '')
    setOffers(data.offers || [])
    setJobs(data.jobs || [])
    setState({ loading: false, error: '', painter: data.painter, availability: data.availability || [] })
  }

  async function submitPinChange(e) {
    e?.preventDefault?.()
    setPinChangeError('')
    if (newPin.length !== 6 || confirmPin.length !== 6) {
      setPinChangeError('PIN musí mít přesně 6 číslic.')
      return
    }
    if (newPin !== confirmPin) {
      setPinChangeError('PINy se neshodují.')
      return
    }

    setPinChangeSubmitting(true)
    const response = await fetch('/api/painter/change-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPin, confirmPin }),
    })
    const data = await response.json()
    setPinChangeSubmitting(false)

    if (response.status === 401) {
      setMustChangePin(false)
      setAuthRequired(true)
      setAuthError(data.error || 'Přihlášení vypršelo. Přihlas se znovu pomocí PINu.')
      return
    }

    if (!response.ok) {
      setPinChangeError(data.error || 'Změna PINu se nepodařila.')
      return
    }

    setMustChangePin(false)
    setNewPin('')
    setConfirmPin('')
    setPinChangeError('')
    setPainterNote(data.painter?.notes || '')
    setOffers(data.offers || [])
    setJobs(data.jobs || [])
    setState({ loading: false, error: '', painter: data.painter, availability: data.availability || [] })
  }

  async function logoutPainter() {
    await fetch('/api/painter/logout', { method: 'POST' })
    setOffers([])
    setJobs([])
    setPainterNote('')
    setPin('')
    setAuthRequired(true)
    setMustChangePin(false)
    setAuthError('')
    setNewPin('')
    setConfirmPin('')
    setPinChangeError('')
    setSelectedItem(null)
    setSelectedCell(null)
    setTab('projects')
    setState((prev) => ({ ...prev, availability: [] }))
  }

  async function handlePushToggle() {
    if (pushState === 'denied') {
      alert('Notifikace jsou zakázané v prohlížeči. Povol je ručně v nastavení a pak stránku obnov.')
      return
    }
    if (pushState === 'granted') return
    if (!swReg.current) return
    try {
      const permission = await Notification.requestPermission()
      setPushState(permission)
      if (permission !== 'granted') return
      const keyResponse = await fetch('/api/painter/push-vapid-key')
      if (!keyResponse.ok) return
      const { publicKey } = await keyResponse.json()
      const subscription = await swReg.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      })
      await fetch('/api/painter/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })
    } catch (error) {
      console.error('[push] subscribe failed:', error)
    }
  }

  useEffect(() => { load() }, [slug])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', onVisible)
    const timer = setInterval(() => { if (!document.hidden) load() }, 60000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(timer)
    }
  }, [slug])

  const availabilityMap = useMemo(() => new Map((state.availability || []).map((row) => [row.date, row])), [state.availability])
  const assignedDates = useMemo(() => new Set(jobs.filter((job) => ACTIVE_JOB_STATUSES.includes(job.status)).map(extractAssignedDate).filter(Boolean)), [jobs])
  const monthCells = useMemo(() => buildMonthCells(month, availabilityMap, assignedDates), [month, availabilityMap, assignedDates])

  async function save(payload, savingKey) {
    setSaving(savingKey)
    const response = await fetch('/api/painter/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    setSaving('')

    if (response.status === 401) {
      setAuthRequired(true)
      setAuthError(data.error || 'Přihlášení vypršelo. Přihlas se znovu pomocí PINu.')
      return false
    }

    if (response.status === 403) {
      setMustChangePin(true)
      setPinChangeError(data.error || 'Nejdřív si nastav vlastní PIN.')
      return false
    }

    if (!response.ok) {
      setState((prev) => ({ ...prev, error: data.error || 'Uložení se nepodařilo.' }))
      return false
    }

    setPainterNote(data.painter?.notes || '')
    setState((prev) => ({ ...prev, error: '', painter: data.painter, availability: data.availability || prev.availability }))
    return true
  }

  async function respondOffer(offerId, decision, estimatedDays) {
    setRespondingId(offerId + decision)
    const response = await fetch('/api/painter/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, decision, estimatedDays: estimatedDays || null }),
    })
    const data = await response.json()
    setRespondingId('')

    if (response.status === 401) {
      setAuthRequired(true)
      setAuthError(data.error || 'Přihlášení vypršelo. Přihlas se znovu pomocí PINu.')
      return
    }

    if (response.status === 403) {
      setMustChangePin(true)
      setPinChangeError(data.error || 'Nejdřív si nastav vlastní PIN.')
      return
    }

    if (!response.ok) {
      setState((prev) => ({ ...prev, error: data.error || 'Reakci se nepodařilo uložit.' }))
      return
    }

    setSelectedItem(null)
    load()
  }

  function openDay(cell) {
    setSelectedCell(cell)
    const base = availabilityMap.get(cell.date) || { status: 'unknown', capacity: 0, accepts_express: false, note: '' }
    setDraft({
      status: base.status === 'unknown' ? 'available' : base.status,
      capacity: base.status === 'unavailable' ? 0 : (base.capacity ?? 1),
      accepts_express: Boolean(base.accepts_express),
      note: base.note || '',
    })
  }

  async function saveDay() {
    if (!selectedCell || !draft || selectedCell.assigned) return
    const payload = {
      entries: [{
        date: selectedCell.date,
        status: draft.status,
        capacity: draft.status === 'unavailable' ? 0 : 1,
        accepts_express: draft.accepts_express,
        note: draft.note,
        source: 'painter',
      }],
    }
    const ok = await save(payload, 'day')
    if (ok) {
      setSelectedCell(null)
      setDraft(null)
    }
  }

  if (state.loading) {
    return <div style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center', color: C.textMid, fontFamily: "'Outfit', sans-serif", fontSize: 15 }}>Načítám portál…</div>
  }

  if (authRequired) {
    return <LoginScreen painter={state.painter} pin={pin} setPin={setPin} submitting={authSubmitting} error={authError} onSubmit={loginPainter} />
  }

  if (mustChangePin) {
    return (
      <ChangePinScreen
        painter={state.painter}
        newPin={newPin}
        setNewPin={setNewPin}
        confirmPin={confirmPin}
        setConfirmPin={setConfirmPin}
        submitting={pinChangeSubmitting}
        error={pinChangeError}
        onSubmit={submitPinChange}
        onLogout={logoutPainter}
      />
    )
  }

  if (selectedItem) {
    return <OrderDetailScreen item={selectedItem} respondingId={respondingId} respondOffer={respondOffer} onBack={() => setSelectedItem(null)} onTabChange={changeTab} />
  }

  return (
    <>
      {tab === 'projects' && <ProjectsScreen offers={offers} jobs={jobs} mode={projectMode} setMode={setProjectMode} onOpenItem={setSelectedItem} onTabChange={changeTab} />}
      {tab === 'availability' && (
        <AvailabilityScreen
          month={month}
          setMonth={setMonth}
          monthCells={monthCells}
          onOpenDay={openDay}
          painterNote={painterNote}
          setPainterNote={setPainterNote}
          save={save}
          saving={saving}
          onTabChange={changeTab}
        />
      )}
      {tab === 'profile' && (
        <ProfileScreen
          painter={state.painter}
          pushState={pushState}
          onPushToggle={handlePushToggle}
          onLogout={logoutPainter}
          painterNote={painterNote}
          onTabChange={changeTab}
        />
      )}

      {selectedCell && draft ? (
        <DaySheet
          cell={selectedCell}
          draft={draft}
          setDraft={setDraft}
          saveDay={saveDay}
          saving={saving}
          onClose={() => {
            setSelectedCell(null)
            setDraft(null)
          }}
        />
      ) : null}

      {!selectedItem && !authRequired && !mustChangePin ? (
        <div style={{ display: 'none' }}>{state.error}</div>
      ) : null}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
