import crypto from 'node:crypto'
import { getAdminCredentials, getSessionSecret } from './config.js'
import { parseCookies } from './http.js'

const COOKIE_NAME = 'mh_admin_session'

function sign(value) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('hex')
}

export function validateAdminCredentials(email, password) {
  const admin = getAdminCredentials()
  return admin.email && admin.password && email === admin.email && password === admin.password
}

export function createAdminCookie(email) {
  const payload = `${email}|${Date.now()}`
  const signature = sign(payload)
  const token = Buffer.from(`${payload}|${signature}`).toString('base64url')
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}; Secure`
}

export function clearAdminCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`
}

export function requireAdmin(req) {
  const cookies = parseCookies(req)
  const token = cookies[COOKIE_NAME]
  if (!token) return null

  try {
    const [email, issuedAt, signature] = Buffer.from(token, 'base64url').toString('utf8').split('|')
    const expected = sign(`${email}|${issuedAt}`)
    if (signature !== expected) return null
    return { email }
  } catch {
    return null
  }
}
