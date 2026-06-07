// Seed test jobs and offers for painter Marek in production
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] })
)

const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const bucket = env.SUPABASE_STORAGE_BUCKET || 'malir-hned2-data'

function id() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}

function now() { return new Date().toISOString() }

const { data: blob, error: dlErr } = await client.storage.from(bucket).download('state.json')
if (dlErr) { console.error('Download error:', dlErr); process.exit(1) }
const state = JSON.parse(await blob.text())

// Find Marek
const marek = state.painters.find(p => p.name === 'Marek')
if (!marek) { console.error('Marek not found'); process.exit(1) }
console.log('Found Marek:', marek.id)

// Add test jobs assigned to Marek
const testJobs = [
  {
    id: id(),
    reference: 'MH-2026-041',
    status: 'in_progress',
    client_name: 'Jana Horáková',
    client_phone: '+420 721 456 789',
    client_email: 'horakova@email.cz',
    client_address: 'Korunní 47, Praha 2',
    service_area: 'Praha 2',
    work_type: 'Běžná bílá výmalba',
    custom_area: '68',
    preferred_date_label: 'Tento týden',
    preferred_time_label: 'Dopoledne',
    confirmed_price: 12500,
    painter_reward: 7200,
    assigned_painter_id: marek.id,
    client_note: 'Prosím přijďte přesně v 8:00, děti ráno spí.',
    created_at: now(),
    updated_at: now(),
  },
  {
    id: id(),
    reference: 'MH-2026-038',
    status: 'assigned',
    client_name: 'Tomáš Blažek',
    client_phone: '+420 602 334 112',
    client_email: 'blazek.t@gmail.com',
    client_address: 'Štefánikova 12, Praha 5',
    service_area: 'Praha 5',
    work_type: 'Stropy + stěny',
    custom_area: '94',
    preferred_date_label: 'Příští pondělí',
    preferred_time_label: 'Odpoledne',
    confirmed_price: 18900,
    painter_reward: 10800,
    assigned_painter_id: marek.id,
    client_note: '',
    created_at: now(),
    updated_at: now(),
  },
  {
    id: id(),
    reference: 'MH-2026-029',
    status: 'done',
    client_name: 'Petra Novotná',
    client_phone: '+420 775 221 003',
    client_email: 'novotna.petra@seznam.cz',
    client_address: 'Náměstí Míru 8, Praha 2',
    service_area: 'Praha 2',
    work_type: 'Malování po rekonstrukci',
    custom_area: '112',
    preferred_date_label: '2. 6. 2026',
    preferred_time_label: 'Celý den',
    confirmed_price: 26000,
    painter_reward: 15500,
    assigned_painter_id: marek.id,
    client_note: 'Byt po rekonstrukci, nová omítka.',
    created_at: now(),
    updated_at: now(),
  },
]

// Add test offers for Marek (pending)
const offerToken1 = id()
const offerToken2 = id()

// Need a job for each offer (not assigned to Marek yet)
const offerJob1 = {
  id: id(),
  reference: 'MH-2026-045',
  status: 'offer_sent',
  client_name: 'Martin Dušek',
  client_phone: '+420 603 118 447',
  client_email: 'dusek@firma.cz',
  client_address: 'Dejvická 33, Praha 6',
  service_area: 'Praha 6',
  work_type: 'Kancelářské prostory',
  custom_area: '200',
  preferred_date_label: 'Flexibilní termín',
  preferred_time_label: '',
  confirmed_price: null,
  painter_reward: 14000,
  assigned_painter_id: null,
  client_note: 'Velká kancelář, 3 místnosti.',
  created_at: now(),
  updated_at: now(),
}

const offerJob2 = {
  id: id(),
  reference: 'MH-2026-044',
  status: 'offer_sent',
  client_name: 'Lenka Součková',
  client_phone: '+420 724 009 881',
  client_email: 'soucek.lenka@email.cz',
  client_address: 'Vinohrady, Praha 2',
  service_area: 'Praha 2',
  work_type: 'Byt 2+kk – výmalba',
  custom_area: '52',
  preferred_date_label: 'Červen 2026',
  preferred_time_label: 'Dopoledne',
  confirmed_price: null,
  painter_reward: 5800,
  assigned_painter_id: null,
  client_note: '',
  created_at: now(),
  updated_at: now(),
}

const testOffers = [
  {
    id: id(),
    job_id: offerJob1.id,
    painter_id: marek.id,
    painter_name: marek.name,
    status: 'pending',
    offer_token: offerToken1,
    offered_payout: offerJob1.painter_reward,
    approx_location: offerJob1.service_area,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: id(),
    job_id: offerJob2.id,
    painter_id: marek.id,
    painter_name: marek.name,
    status: 'accepted',
    offer_token: offerToken2,
    offered_payout: offerJob2.painter_reward,
    approx_location: offerJob2.service_area,
    created_at: now(),
    updated_at: now(),
  },
]

// Merge into state
if (!state.jobs) state.jobs = []
if (!state.job_offers) state.job_offers = []

state.jobs.push(...testJobs, offerJob1, offerJob2)
state.job_offers.push(...testOffers)

const updated = JSON.stringify(state)
const { error: upErr } = await client.storage.from(bucket).upload('state.json', updated, {
  contentType: 'application/json',
  upsert: true,
})
if (upErr) { console.error('Upload error:', upErr); process.exit(1) }

console.log('Done! Added:')
console.log('  Jobs:', testJobs.map(j => j.reference).join(', '))
console.log('  Offers:', testOffers.length, '(1 pending, 1 accepted)')
