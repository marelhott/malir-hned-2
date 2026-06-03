export function getEnv(name, fallback = '') {
  return process.env[name] || fallback
}

export function isProduction() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}

export function getAppBaseUrl(req) {
  const explicit = getEnv('APP_BASE_URL')
  if (explicit) return explicit.replace(/\/$/, '')

  const host = req.headers['x-forwarded-host'] || req.headers.host
  const proto = req.headers['x-forwarded-proto'] || 'https'
  return `${proto}://${host}`
}

export function getAdminCredentials() {
  const email = getEnv('ADMIN_EMAIL', isProduction() ? '' : 'admin@malirhned.local')
  const password = getEnv('ADMIN_PASSWORD', isProduction() ? '' : 'demo1234')
  return { email, password }
}

export function getSessionSecret() {
  return getEnv('ADMIN_SESSION_SECRET', isProduction() ? '' : 'dev-session-secret')
}

export function getOfferExpiryMinutes() {
  return Number(getEnv('OFFER_EXPIRY_MINUTES', '10')) || 10
}

export function getSupabaseConfig() {
  return {
    url: getEnv('SUPABASE_URL'),
    serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  }
}

export function hasSupabaseConfig() {
  const { url, serviceRoleKey } = getSupabaseConfig()
  return Boolean(url && serviceRoleKey)
}
