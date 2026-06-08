/**
 * Email sending via Resend API.
 * All sends are fire-and-forget — errors are logged but never throw to callers.
 */

const RESEND_API = 'https://api.resend.com/emails'

function getResendKey() {
  return process.env.RESEND_API_KEY || ''
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'Malíř Hned <info@malirhned.cz>'
}

function getAdminEmail() {
  return process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'admin@malirhned.cz'
}

async function sendEmail({ to, subject, html }) {
  const key = getResendKey()
  if (!key) { console.warn('[email] RESEND_API_KEY not set — skipping send'); return }
  if (!to) { console.warn('[email] No recipient — skipping send'); return }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: getFromEmail(), to: Array.isArray(to) ? to : [to], subject, html }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('[email] Resend error:', data)
    } else {
      console.log('[email] Sent to', to, '— id:', data.id)
    }
  } catch (err) {
    console.error('[email] Send failed:', err.message)
  }
}

// ─── Šablona obálky ──────────────────────────────────────────────────────────
function wrap(title, body) {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f0ece6;font-family:'Helvetica Neue',Arial,sans-serif;color:#18170f}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .head{background:#1a3d2b;padding:28px 32px}
  .head h1{margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-.3px}
  .head p{margin:4px 0 0;color:#a8c4b0;font-size:13px}
  .body{padding:28px 32px}
  .body h2{margin:0 0 12px;font-size:18px;color:#18170f}
  .body p{margin:0 0 14px;font-size:15px;line-height:1.6;color:#3a3a30}
  .pill{display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600}
  .pill-green{background:#dcf5e5;color:#1a6a3a}
  .pill-amber{background:#fef3c7;color:#92400e}
  .box{background:#f7f4ef;border-radius:10px;padding:16px 18px;margin:18px 0;font-size:14px;line-height:1.7}
  .box strong{display:block;color:#18170f;margin-bottom:2px}
  .btn{display:inline-block;padding:13px 28px;background:#1a6a3a;color:#fff!important;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;margin:8px 0}
  .foot{padding:18px 32px;border-top:1px solid #f0ede7;font-size:12px;color:#9a9488;text-align:center}
</style></head>
<body>
<div class="wrap">
  <div class="head">
    <h1>Malíř Hned</h1>
    <p>${title}</p>
  </div>
  <div class="body">${body}</div>
  <div class="foot">Malíř Hned · Praha a Středočeský kraj · <a href="https://malir-hned2.vercel.app" style="color:#1a6a3a">malir-hned2.vercel.app</a></div>
</div>
</body></html>`
}

// ─── Šablony ─────────────────────────────────────────────────────────────────

/**
 * Klientovi — potvrzení přijetí poptávky
 */
export async function sendJobReceived({ job, publicUrl, cancelUrl }) {
  const subject = `✅ Poptávka ${job.reference} přijata — Malíř Hned`
  const html = wrap('Potvrzení poptávky', `
    <h2>Dostali jsme vaši poptávku</h2>
    <p>Děkujeme, <strong>${job.client_name || 'zákazníku'}</strong>! Vaše poptávka byla přijata a naši dispečeři ji zpracují co nejdříve.</p>
    <div class="box">
      <strong>Číslo zakázky</strong>${job.reference}
      <strong style="margin-top:10px">Typ práce</strong>${job.work_type || '—'}
      <strong style="margin-top:10px">Termín</strong>${job.preferred_date_label || job.preferred_date || '—'}
      <strong style="margin-top:10px">Plocha</strong>${job.size_label || '—'}
    </div>
    <p>Sledujte stav zakázky kliknutím na tlačítko:</p>
    <a class="btn" href="${publicUrl}">Sledovat stav zakázky →</a>
    <p style="margin-top:18px;font-size:13px;color:#9a9488">Chcete zakázku zrušit? <a href="${cancelUrl}" style="color:#1a6a3a">Klikněte zde</a></p>
  `)
  await sendEmail({ to: job.client_email || job.client_phone, subject, html })
}

/**
 * Adminovi — nová zakázka přišla
 */
export async function sendAdminNewJob({ job, adminUrl }) {
  const subject = `🆕 Nová zakázka ${job.reference} — ${job.client_name}`
  const html = wrap('Nová poptávka', `
    <h2>Nová zakázka v systému</h2>
    <span class="pill pill-amber">Čeká na zpracování</span>
    <div class="box">
      <strong>Zákazník</strong>${job.client_name} · ${job.client_phone}
      <strong style="margin-top:10px">Typ práce</strong>${job.work_type || '—'}
      <strong style="margin-top:10px">Adresa</strong>${job.locality || job.address || '—'}
      <strong style="margin-top:10px">Termín</strong>${job.preferred_date_label || '—'}
      <strong style="margin-top:10px">Plocha</strong>${job.size_label || '—'}
    </div>
    <a class="btn" href="${adminUrl}">Otevřít dispečink →</a>
  `)
  await sendEmail({ to: getAdminEmail(), subject, html })
}

/**
 * Malíři — nabídka zakázky
 */
export async function sendPainterOffer({ painter, job, offerUrl, expiresAt }) {
  const subject = `🎨 Nová zakázka pro vás — Malíř Hned`
  const expiresLabel = expiresAt ? new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(expiresAt)) : '—'
  const html = wrap('Nabídka práce', `
    <h2>Máme pro vás zakázku, ${painter.name}</h2>
    <p>V dispečinku je dostupná zakázka, která odpovídá vašemu profilu. Nabídka vyprší: <strong>${expiresLabel}</strong></p>
    <div class="box">
      <strong>Typ práce</strong>${job.work_type || '—'}
      <strong style="margin-top:10px">Lokalita</strong>${job.locality || '—'}
      <strong style="margin-top:10px">Plocha</strong>${job.size_label || '—'}
      <strong style="margin-top:10px">Termín</strong>${job.preferred_date_label || '—'}
      <strong style="margin-top:10px">Vaše odměna</strong>${job.painter_payout ? job.painter_payout.toLocaleString('cs-CZ') + ' Kč' : '—'}
    </div>
    <a class="btn" href="${offerUrl}">Zobrazit a přijmout nabídku →</a>
    <p style="font-size:13px;color:#9a9488;margin-top:16px">Na nabídku reagujte přes tlačítko výše — nevyplňujte kontakty ani adresu klienta, ty dostanete po potvrzení.</p>
  `)
  await sendEmail({ to: painter.email, subject, html })
}

/**
 * Klientovi — zakázka potvrzena, malíř přiřazen
 */
export async function sendJobAssigned({ job, painter, publicUrl }) {
  const subject = `🎉 Zakázka ${job.reference} potvrzena — přijede ${painter.name}`
  const html = wrap('Zakázka potvrzena', `
    <h2>Výborně! Máte svého malíře</h2>
    <span class="pill pill-green">Potvrzeno</span>
    <p style="margin-top:14px">Zakázku <strong>${job.reference}</strong> vyřídí <strong>${painter.name}</strong>. Malíř vás brzy kontaktuje pro upřesnění detailů.</p>
    <div class="box">
      <strong>Malíř</strong>${painter.name}
      <strong style="margin-top:10px">Termín</strong>${job.preferred_date_label || '—'}
      <strong style="margin-top:10px">Adresa</strong>${job.address || job.locality || '—'}
    </div>
    <a class="btn" href="${publicUrl}">Detail zakázky →</a>
    <p style="font-size:13px;color:#9a9488;margin-top:16px">V případě dotazů nás kontaktujte na <a href="mailto:info@malirhned.cz" style="color:#1a6a3a">info@malirhned.cz</a></p>
  `)
  await sendEmail({ to: job.client_email, subject, html })
}

/**
 * Malíři — kontakt na klienta odemčen po potvrzení
 */
export async function sendPainterContactUnlocked({ painter, job, portalUrl }) {
  const subject = `📞 Kontakt na klienta odemčen — ${job.reference}`
  const html = wrap('Kontakt odemčen', `
    <h2>Zakázka potvrzena, volejte klientovi</h2>
    <p>Vaše nabídka pro zakázku <strong>${job.reference}</strong> byla potvrzena. Níže jsou kontaktní údaje klienta:</p>
    <div class="box">
      <strong>Klient</strong>${job.client_name}
      <strong style="margin-top:10px">Telefon</strong><a href="tel:${job.client_phone}" style="color:#1a6a3a">${job.client_phone}</a>
      ${job.client_email ? `<strong style="margin-top:10px">E-mail</strong><a href="mailto:${job.client_email}" style="color:#1a6a3a">${job.client_email}</a>` : ''}
      <strong style="margin-top:10px">Adresa</strong>${job.address || job.locality || '—'}
      <strong style="margin-top:10px">Termín</strong>${job.preferred_date_label || '—'}
    </div>
    <a class="btn" href="${portalUrl}">Otevřít váš portál →</a>
  `)
  await sendEmail({ to: painter.email, subject, html })
}
