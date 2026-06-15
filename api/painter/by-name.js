import { sendJson, sendMethodNotAllowed, getQuery } from '../../lib/server/http.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  try {
    const { name } = getQuery(req)
    if (!name) return sendJson(res, 400, { error: 'Chybí jméno malíře.' })
    return sendJson(res, 410, {
      error: 'Přímý přístup podle jména byl z bezpečnostních důvodů vypnut. Otevřete soukromý odkaz s tokenem.',
    })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Nepodařilo se načíst profil malíře.' })
  }
}
