import crypto from 'node:crypto'
import { getAdminCredentials, getSessionSecret } from './config.js'
import { parseCookies } from './http.js'

const ADMIN_COOKIE_NAME = 'mh_admin_session'
const PAINTER_COOKIE_NAME = 'mh_painter_session'
const PAINTER_MAX_FAILED_ATTEMPTS = 5
const PAINTER_LOCK_WINDOW_MS = 10 * 60 * 1000
const painterLoginAttempts = new Map()
const PUBLIC_JOB_MAX_ATTEMPTS = 6
const PUBLIC_JOB_WINDOW_MS = 15 * 60 * 1000
const publicJobAttempts = new Map()

function sign(value) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('hex')
}

function createSignedCookie(name, payload, maxAgeSeconds) {
  const signature = sign(payload)
  const token = Buffer.from(`${payload}|${signature}`).toString('base64url')
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}; Secure`
}

function clearSignedCookie(name) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`
}

function decodeSignedCookie(token) {
  if (!token) return null
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const parts = decoded.split('|')
    if (parts.length < 3) return null
    const signature = parts.pop()
    const payload = parts.join('|')
    const expected = sign(payload)
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) return null
    return parts
  } catch {
    return null
  }
}

export function validateAdminCredentials(email, password) {
  const admin = getAdminCredentials()
  return admin.email && admin.password && email === admin.email && password === admin.password
}

export function createAdminCookie(email) {
  const payload = `${email}|${Date.now()}`
  return createSignedCookie(ADMIN_COOKIE_NAME, payload, 60 * 60 * 24 * 7)
}

export function clearAdminCookie() {
  return clearSignedCookie(ADMIN_COOKIE_NAME)
}

export function requireAdmin(req) {
  const cookies = parseCookies(req)
  const parts = decodeSignedCookie(cookies[ADMIN_COOKIE_NAME])
  if (!parts) return null
  const [email] = parts
  if (!email) return null
  return { email }
}

export function createPainterCookie(painterId, sessionVersion) {
  const payload = `${painterId}|${sessionVersion}|${Date.now()}`
  return createSignedCookie(PAINTER_COOKIE_NAME, payload, 60 * 60 * 24 * 30)
}

export function clearPainterCookie() {
  return clearSignedCookie(PAINTER_COOKIE_NAME)
}

export function requirePainterSession(req) {
  const cookies = parseCookies(req)
  const parts = decodeSignedCookie(cookies[PAINTER_COOKIE_NAME])
  if (!parts || parts.length < 3) return null
  const [painterId, sessionVersion] = parts
  if (!painterId || !sessionVersion) return null
  return { painterId, sessionVersion }
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  return forwarded || req.socket?.remoteAddress || 'unknown'
}

function painterAttemptKey(req, slug) {
  return `${slug || 'unknown'}|${getClientIp(req)}`
}

function getPainterAttemptState(req, slug) {
  const key = painterAttemptKey(req, slug)
  const current = painterLoginAttempts.get(key)
  if (!current) return { key, attempts: 0, lockedUntil: 0 }
  if (current.lockedUntil && current.lockedUntil < Date.now()) {
    painterLoginAttempts.delete(key)
    return { key, attempts: 0, lockedUntil: 0 }
  }
  return { key, ...current }
}

export function getPainterLoginLock(req, slug) {
  const state = getPainterAttemptState(req, slug)
  if (state.lockedUntil && state.lockedUntil > Date.now()) {
    return {
      isLocked: true,
      retryAfterMs: state.lockedUntil - Date.now(),
    }
  }
  return { isLocked: false, retryAfterMs: 0 }
}

export function recordPainterLoginFailure(req, slug) {
  const state = getPainterAttemptState(req, slug)
  const attempts = state.attempts + 1
  const next = { attempts, lockedUntil: 0 }
  if (attempts >= PAINTER_MAX_FAILED_ATTEMPTS) {
    next.lockedUntil = Date.now() + PAINTER_LOCK_WINDOW_MS
  }
  painterLoginAttempts.set(state.key, next)
  return {
    attempts,
    isLocked: next.lockedUntil > Date.now(),
    retryAfterMs: Math.max(0, next.lockedUntil - Date.now()),
    attemptsRemaining: Math.max(0, PAINTER_MAX_FAILED_ATTEMPTS - attempts),
  }
}

export function clearPainterLoginFailures(req, slug) {
  painterLoginAttempts.delete(painterAttemptKey(req, slug))
}

function publicJobAttemptKey(req) {
  return getClientIp(req)
}

function getPublicJobAttemptState(req) {
  const key = publicJobAttemptKey(req)
  const current = publicJobAttempts.get(key)
  if (!current) return { key, attempts: 0, windowEndsAt: 0 }
  if (current.windowEndsAt < Date.now()) {
    publicJobAttempts.delete(key)
    return { key, attempts: 0, windowEndsAt: 0 }
  }
  return { key, ...current }
}

export function getPublicJobRateLimit(req) {
  const state = getPublicJobAttemptState(req)
  const remaining = Math.max(0, PUBLIC_JOB_MAX_ATTEMPTS - state.attempts)
  const retryAfterMs = state.windowEndsAt > Date.now() ? state.windowEndsAt - Date.now() : 0
  return {
    isLimited: state.attempts >= PUBLIC_JOB_MAX_ATTEMPTS && retryAfterMs > 0,
    attemptsRemaining: remaining,
    retryAfterMs,
  }
}

export function recordPublicJobAttempt(req) {
  const state = getPublicJobAttemptState(req)
  const next = {
    attempts: state.attempts + 1,
    windowEndsAt: state.windowEndsAt > Date.now() ? state.windowEndsAt : Date.now() + PUBLIC_JOB_WINDOW_MS,
  }
  publicJobAttempts.set(state.key, next)
  return {
    attempts: next.attempts,
    attemptsRemaining: Math.max(0, PUBLIC_JOB_MAX_ATTEMPTS - next.attempts),
    retryAfterMs: Math.max(0, next.windowEndsAt - Date.now()),
    isLimited: next.attempts >= PUBLIC_JOB_MAX_ATTEMPTS,
  }
}
