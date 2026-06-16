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

function randomPin() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

async function main() {
  const env = parseEnv(await readFile(envFile, 'utf8'))
  const adminEmail = env.ADMIN_EMAIL
  const adminPassword = env.ADMIN_PASSWORD
  const baseUrl = (env.APP_BASE_URL || 'https://malirhned.cz').replace(/\/$/, '')
  if (!adminEmail || !adminPassword) {
    throw new Error('V .env.dev chybí ADMIN_EMAIL nebo ADMIN_PASSWORD.')
  }

  const allowedNames = new Set(DEFAULT_PAINTERS.map((item) => item.name))
  const cookieJar = []

  async function requestJson(method, url, payload = null) {
    const headers = {}
    if (payload != null) headers['Content-Type'] = 'application/json'
    if (cookieJar.length > 0) headers.Cookie = cookieJar.join('; ')
    const res = await fetch(url, {
      method,
      headers,
      body: payload != null ? JSON.stringify(payload) : undefined,
    })
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) cookieJar.length = 0, cookieJar.push(setCookie.split(';')[0])
    const text = await res.text()
    const json = text ? JSON.parse(text) : null
    if (!res.ok) {
      throw new Error(`${method} ${url} selhalo: ${res.status} ${text}`)
    }
    return json
  }

  await requestJson('POST', `${baseUrl}/api/admin/login`, {
    email: adminEmail,
    password: adminPassword,
  })

  const painters = (await requestJson('GET', `${baseUrl}/api/admin/painters`)).painters
  const output = []

  for (const painter of painters.filter((item) => allowedNames.has(item.name))) {
    const pin = randomPin()
    const response = await requestJson('POST', `${baseUrl}/api/admin/painter-pin`, {
      painterId: painter.id,
      pin,
    })
    output.push({
      name: painter.name,
      email: painter.email,
      pin,
      url: `${baseUrl}${response.result.portalUrl || `/maliri/${slugifyPainterName(painter.name)}`}`,
    })
  }

  const outputPath = `/tmp/malirhned-painter-pins-${new Date().toISOString().slice(0, 10)}.txt`
  const lines = output.map((item) => `${item.name} | ${item.email || '—'} | PIN ${item.pin} | ${item.url}`)
  await writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8')
  console.log(JSON.stringify({ ok: true, outputPath, painters: output }, null, 2))
}

await main()
