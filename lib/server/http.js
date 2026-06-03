export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(new Error('Neplatný JSON payload.'))
      }
    })
    req.on('error', reject)
  })
}

export function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  })
  res.end(JSON.stringify(payload))
}

export function sendMethodNotAllowed(res, allowed = ['GET']) {
  return sendJson(res, 405, { error: 'Method not allowed' }, { Allow: allowed.join(', ') })
}

export function parseCookies(req) {
  const raw = req.headers.cookie || ''
  return raw.split(';').reduce((acc, item) => {
    const [key, ...rest] = item.trim().split('=')
    if (!key) return acc
    acc[key] = decodeURIComponent(rest.join('='))
    return acc
  }, {})
}

export function getQuery(req) {
  const url = new URL(req.url, 'http://localhost')
  return Object.fromEntries(url.searchParams.entries())
}
