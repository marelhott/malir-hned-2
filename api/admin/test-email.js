import { sendJson, sendMethodNotAllowed } from '../../lib/server/http.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  const key = process.env.RESEND_API_KEY || ''
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const to = process.env.ADMIN_NOTIFY_EMAIL || 'test@test.com'

  if (!key) return sendJson(res, 500, { error: 'RESEND_API_KEY not set' })

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: '[TEST] Malir Hned email test',
        html: '<p>Testovaci email z Vercel. Pokud jste ho dostali, vse funguje.</p>',
      }),
    })
    const data = await r.json()
    return sendJson(res, 200, {
      resend_status: r.status,
      resend_ok: r.ok,
      resend_response: data,
      env: { key_prefix: key.slice(0, 8) + '...', from, to },
    })
  } catch (err) {
    return sendJson(res, 500, { error: err.message })
  }
}
