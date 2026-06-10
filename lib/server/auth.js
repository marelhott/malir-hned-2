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
  const token = cookies['mh_admin_session']
  if (!token) return null
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const parts = decoded.split('|')
    if (parts.length < 3) return null
    const signature = parts.pop()
    const payload = parts.join('|')
    const expected = sign(payload)
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) return null
    const [email] = parts
    if (!email) return null
    return { email }
  } catch {
    return null
  }
}
