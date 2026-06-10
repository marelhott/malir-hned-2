/**
 * Web Push notifications via VAPID.
 *
 * Required env vars:
 *   VAPID_PUBLIC_KEY   — base64url-encoded public key
 *   VAPID_PRIVATE_KEY  — base64url-encoded private key
 *   VAPID_SUBJECT      — mailto: or https: contact URL
 *
 * Generate keys once:
 *   node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k,null,2))"
 * then set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Vercel env.
 */

import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

function getDb() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getVapidConfig() {
  return {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:info@malirhned.cz',
  }
}

/**
 * Store a push subscription for a painter.
 * Called from api/painter/push-subscribe.js
 */
export async function storePushSubscription(painterId, subscription) {
  const db = getDb()
  if (!db) return
  const endpoint = subscription.endpoint
  await db.from('push_subscriptions').upsert(
    { painter_id: painterId, endpoint, subscription: JSON.stringify(subscription), updated_at: new Date().toISOString() },
    { onConflict: 'endpoint' }
  )
}

/**
 * Remove a push subscription (e.g. after 410 Gone from push service).
 */
export async function removePushSubscription(endpoint) {
  const db = getDb()
  if (!db) return
  await db.from('push_subscriptions').delete().eq('endpoint', endpoint)
}

/**
 * Send a push notification to all subscriptions for a given painterId.
 */
export async function sendPushToAll(painterId, { title, body, url = '/' }) {
  const db = getDb()
  if (!db) return
  const vapid = getVapidConfig()
  if (!vapid.publicKey || !vapid.privateKey) {
    console.warn('[push] VAPID keys not configured — skipping push')
    return
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)

  const { data: rows } = await db
    .from('push_subscriptions')
    .select('endpoint, subscription')
    .eq('painter_id', painterId)

  if (!rows?.length) return

  const payload = JSON.stringify({ title, body, url })

  await Promise.all(rows.map(async (row) => {
    let sub
    try {
      sub = typeof row.subscription === 'string' ? JSON.parse(row.subscription) : row.subscription
      await webpush.sendNotification(sub, payload)
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await removePushSubscription(row.endpoint)
      } else {
        console.error('[push] send failed:', err.message)
      }
    }
  }))
}
