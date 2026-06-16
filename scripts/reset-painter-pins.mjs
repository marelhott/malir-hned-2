import crypto from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_PAINTERS } from '../lib/server/painters.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const envFile = path.join(rootDir, '.env.dev')

function slugifyPainterName(name = '') {
  return String(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'malir'
}

function parseEnv(raw) {
  return raw.split('\n').reduce((acc, line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return acc
    const idx = trimmed.indexOf('=')
    if (idx === -1) return acc
    const key = trimmed.slice(0, idx)
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    acc[key] = value
    return acc
  }, {})
}

function randomSessionVersion() {
  return `sv_${crypto.randomBytes(18).toString('base64url')}`
}

function randomPin() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

function hashPainterPin(pin, salt = crypto.randomBytes(16).toString('hex')) {
  const digest = crypto.scryptSync(String(pin), salt, 32).toString('hex')
  return `pin$${salt}$${digest}`
}

async function main() {
  const env = parseEnv(await readFile(envFile, 'utf8'))
  const supabaseUrl = env.SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('V .env.dev chybí SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY.')
  }

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }

  const listRes = await fetch(`${supabaseUrl}/rest/v1/painters?select=id,name,email`, { headers })
  if (!listRes.ok) {
    throw new Error(`Načtení malířů selhalo: ${listRes.status} ${await listRes.text()}`)
  }
  const painters = await listRes.json()
  const allowedNames = new Set(DEFAULT_PAINTERS.map((item) => item.name))
  const output = []

  for (const painter of painters.filter((item) => allowedNames.has(item.name))) {
    const pin = randomPin()
    const sessionVersion = randomSessionVersion()
    const pinHash = hashPainterPin(pin)
    const patchRes = await fetch(`${supabaseUrl}/rest/v1/painters?id=eq.${encodeURIComponent(painter.id)}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        portal_access_token: sessionVersion,
        portal_token_hash: pinHash,
        updated_at: new Date().toISOString(),
      }),
    })
    if (!patchRes.ok) {
      throw new Error(`Uložení PINu pro ${painter.name} selhalo: ${patchRes.status} ${await patchRes.text()}`)
    }
    output.push({
      name: painter.name,
      email: painter.email,
      pin,
      url: `https://malirhned.cz/maliri/${slugifyPainterName(painter.name)}`,
    })
  }

  const outputPath = `/tmp/malirhned-painter-pins-${new Date().toISOString().slice(0, 10)}.txt`
  const lines = output.map((item) => `${item.name} | ${item.email || '—'} | PIN ${item.pin} | ${item.url}`)
  await writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8')
  console.log(JSON.stringify({ ok: true, outputPath, painters: output }, null, 2))
}

await main()
