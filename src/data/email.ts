/**
 * email.ts — Server-side branded email rendering + delivery.
 *
 * WHY SERVER-SIDE?
 *   The browser can compose a branded email for copy/paste, but only the
 *   server can actually *deliver* one (the SendGrid API key must never reach
 *   the client). This module owns:
 *     1. Rendering the branded HTML shell (mirrors buildBrandedEmail() in the
 *        client so pasted and auto-sent emails look identical).
 *     2. Talking to the configured provider (currently SendGrid).
 *
 * PROVIDER SUPPORT
 *   SendGrid is fully wired. Mailgun/SMTP remain unimplemented and are
 *   reported honestly as 'unsupported' rather than silently pretending to send.
 */

import { garageSettings, updateGarageSettings } from './store.js'

// ─── Brand fallbacks (kept in sync with TWIGA_BRAND in store.ts) ─────────────
const FALLBACK_PRIMARY = '#122886'
const FALLBACK_DARK    = '#0b1a5c'

/**
 * SendGrid API base. Overridable via SENDGRID_API_BASE for:
 *   - the EU data-residency endpoint (https://api.eu.sendgrid.com)
 *   - a staging/mock endpoint during testing
 * Defaults to the global endpoint.
 */
const SENDGRID_BASE = (process.env.SENDGRID_API_BASE || 'https://api.sendgrid.com').replace(/\/$/, '')

/** HTML-escape untrusted values before interpolating into markup. */
export function esc(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface EmailItemRow  { label: string; value: string }
export interface EmailTotalRow { label: string; value: string; bold?: boolean }

/**
 * Build a branded line-item table (services/parts + totals).
 * Table-based with inline styles — Outlook and Gmail strip <style> blocks.
 */
export function renderItemsTable(
  rows: EmailItemRow[],
  opts: { itemLabel?: string; totals?: EmailTotalRow[] } = {},
): string {
  if (!rows?.length && !opts.totals?.length) return ''
  const primary = garageSettings.brandPrimary || FALLBACK_PRIMARY

  const head =
    `<tr style="background:${primary};color:#fff;">` +
    `<th align="left" style="padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">${esc(opts.itemLabel || 'Description')}</th>` +
    `<th align="right" style="padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Amount</th></tr>`

  const body = (rows || []).map((r, i) =>
    `<tr style="background:${i % 2 ? '#f8fafc' : '#ffffff'};">` +
    `<td style="padding:8px 10px;font-size:13px;color:#334155;border-bottom:1px solid #eef1f6;">${esc(r.label)}</td>` +
    `<td align="right" style="padding:8px 10px;font-size:13px;color:#0f172a;border-bottom:1px solid #eef1f6;white-space:nowrap;">${esc(r.value)}</td></tr>`,
  ).join('')

  const totals = (opts.totals || []).map(t =>
    `<tr><td style="padding:8px 10px;font-size:${t.bold ? 14 : 13}px;color:${t.bold ? primary : '#64748b'};font-weight:${t.bold ? 700 : 400};">${esc(t.label)}</td>` +
    `<td align="right" style="padding:8px 10px;font-size:${t.bold ? 15 : 13}px;color:${t.bold ? primary : '#0f172a'};font-weight:${t.bold ? 700 : 600};white-space:nowrap;">${esc(t.value)}</td></tr>`,
  ).join('')

  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
    'style="border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">' +
    head + body +
    (totals ? `<tr><td colspan="2" style="padding:0;"><div style="border-top:2px solid ${primary};"></div></td></tr>${totals}` : '') +
    '</table>'
}

export interface BrandedEmailOpts {
  subject?: string
  docLabel?: string      // small uppercase label in the header band
  headline?: string
  subhead?: string
  bodyHtml: string
  origin?: string        // absolute base URL for logo images
}

/**
 * Wrap body content in the branded, email-client-safe HTML shell.
 * Mirrors buildBrandedEmail() on the client so both paths look identical.
 */
export function renderBrandedEmail(opts: BrandedEmailOpts): string {
  const g       = garageSettings
  const primary = g.brandPrimary || FALLBACK_PRIMARY
  const dark    = g.brandDark    || FALLBACK_DARK
  const name    = g.garageName   || g.tradingName || 'Garage'

  // Email clients cannot resolve relative URLs — make the logo absolute.
  let logo = g.logoLightUrl || ''
  if (logo && !logo.startsWith('data:') && !logo.startsWith('http') && opts.origin) {
    logo = opts.origin.replace(/\/$/, '') + logo
  }
  // Data-URL logos can be megabytes and bloat every message; skip them.
  if (logo.startsWith('data:') && logo.length > 60_000) logo = ''

  const contact: string[] = []
  if (g.phone)   contact.push('Tel: ' + g.phone)
  if (g.email)   contact.push(g.email)
  if (g.website) contact.push(g.website)

  const sig = g.emailSignature || (name + ' Team' + (g.phone ? '\n' + g.phone : ''))

  return '<!DOCTYPE html><html><head><meta charset="utf-8"/>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>' +
    `<title>${esc(opts.subject || name)}</title></head>` +
    '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Helvetica,Arial,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">' +

      // Header band
      `<tr><td style="background:${primary};background-image:linear-gradient(135deg,${dark},${primary});padding:26px 30px;">` +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
          (logo ? `<td width="66" valign="middle" style="padding-right:14px;"><img src="${esc(logo)}" alt="${esc(name)}" width="60" style="display:block;width:60px;height:auto;"/></td>` : '') +
          '<td valign="middle">' +
            `<div style="color:#ffffff;font-size:19px;font-weight:700;line-height:1.2;">${esc(name)}</div>` +
            `<div style="color:rgba(255,255,255,.75);font-size:12px;margin-top:3px;">${esc(g.tagline || '')}</div>` +
          '</td>' +
          (opts.docLabel ? `<td valign="middle" align="right"><div style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${esc(opts.docLabel)}</div></td>` : '') +
        '</tr></table>' +
      '</td></tr>' +

      // Headline
      (opts.headline
        ? `<tr><td style="padding:22px 30px 0;"><h1 style="margin:0;font-size:20px;color:#0f172a;font-weight:700;">${esc(opts.headline)}</h1>` +
          (opts.subhead ? `<p style="margin:6px 0 0;font-size:13px;color:#64748b;">${esc(opts.subhead)}</p>` : '') + '</td></tr>'
        : '') +

      // Body
      `<tr><td style="padding:20px 30px 26px;font-size:14px;line-height:1.65;color:#334155;">${opts.bodyHtml || ''}</td></tr>` +

      // Signature
      '<tr><td style="padding:0 30px 26px;font-size:14px;color:#334155;">' +
        '<div style="border-top:1px solid #e2e8f0;padding-top:16px;">' +
        `Kind regards,<br/><strong style="color:${primary};">${esc(sig).replace(/\n/g, '<br/>')}</strong></div>` +
      '</td></tr>' +

      // Footer band
      `<tr><td style="background:#f5f6fc;border-top:2px solid ${primary};padding:18px 30px;text-align:center;">` +
        `<div style="font-size:12px;font-weight:700;color:${primary};">${esc(name)}</div>` +
        (contact.length ? `<div style="font-size:11px;color:#64748b;margin-top:5px;">${esc(contact.join('  ·  '))}</div>` : '') +
        (g.documentFooter ? `<div style="font-size:10px;color:#94a3b8;margin-top:8px;font-style:italic;">${esc(g.documentFooter)}</div>` : '') +
        `<div style="font-size:10px;color:#b6bfcd;margin-top:8px;">This is an automated message from ${esc(name)}.</div>` +
      '</td></tr>' +

    '</table></td></tr></table></body></html>'
}

/** Strip HTML to a readable plain-text alternative (multipart fallback). */
export function htmlToText(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(tr|div|p|h1|h2|h3|table)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<td[^>]*>/gi, '  ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export interface Attachment {
  filename: string
  content: string     // base64, no data: prefix
  type?: string
}

export interface SendResult {
  ok: boolean
  status: 'sent' | 'failed' | 'unsupported' | 'disabled'
  message: string
  providerStatus?: number
}

/** Is a usable email provider configured? */
export function emailConfigured(): { ok: boolean; reason?: string } {
  const g = garageSettings
  if (!g.emailEnabled) return { ok: false, reason: 'Email sending is disabled in Settings → Notifications.' }

  if (g.emailProvider === 'sendgrid') {
    if (!g.emailApiKey) return { ok: false, reason: 'SendGrid API key is missing. Add it in Settings → Notifications.' }
    if (!g.emailFrom)   return { ok: false, reason: 'A verified "From" address is required. Set it in Settings → Notifications.' }
    return { ok: true }
  }

  if (g.emailProvider === 'smtp') {
    if (!g.smtpHost)     return { ok: false, reason: 'SMTP host is missing (e.g. mail.yourgarage.co.tz). Add it in Settings → Notifications.' }
    if (!g.smtpUser)     return { ok: false, reason: 'SMTP username is missing — usually your full email address.' }
    if (!g.smtpPassword) return { ok: false, reason: 'SMTP password is missing. Add your mailbox password in Settings → Notifications.' }
    if (!g.emailFrom && !g.smtpUser) return { ok: false, reason: 'A "From" address is required.' }
    return { ok: true }
  }

  if (g.emailProvider === 'none') {
    return { ok: false, reason: 'No email provider selected. Choose SMTP (cPanel) or SendGrid in Settings → Notifications.' }
  }
  return { ok: false, reason: `Provider "${g.emailProvider}" is not implemented — use SMTP (cPanel) or SendGrid.` }
}

/** Resolve the effective From address (SMTP servers usually require the mailbox). */
function fromAddress(): string {
  const g = garageSettings
  return g.emailFrom || g.smtpUser || 'noreply@localhost'
}

function fromName(): string {
  const g = garageSettings
  return g.emailFromName || g.garageName || g.tradingName || 'Garage'
}

/**
 * Resolve port + TLS mode.
 *
 * The PORT is authoritative, deliberately:
 *   465            → implicit TLS ("secure": TLS handshake starts immediately)
 *   587 / 25 / etc → STARTTLS      ("secure": false, upgraded after greeting)
 *
 * Getting this pair wrong is the classic SMTP failure: connecting in plaintext
 * to an implicit-TLS port makes the server wait for a TLS handshake that never
 * comes, while the client waits for a text greeting — the connection then dies
 * with "Greeting never received". Because the two ends deadlock, the symptom
 * looks exactly like a firewall/port block, which sends people hunting the
 * wrong problem entirely.
 *
 * smtpSecure is therefore only honoured as an override on NON-465 ports (some
 * hosts run implicit TLS on a custom port). On 465 it is always forced true.
 */
function smtpPortAndSecure(): { port: number; secure: boolean } {
  const g = garageSettings
  const port = Number(g.smtpPort) || 587
  if (port === 465) return { port, secure: true }
  const secure = g.smtpSecure === true ? true : false
  return { port, secure }
}

/**
 * Turn a raw SMTP/nodemailer error into something a garage owner can act on.
 * Shared-hosting failures are usually one of a small set of causes.
 */
function explainSmtpError(err: any): string {
  const code = err?.code || ''
  const resp = err?.response || err?.message || String(err)
  const cmd  = err?.command ? ` (during ${err.command})` : ''

  if (code === 'EAUTH' || /535|534|password|authenticat/i.test(resp)) {
    return `The mail server rejected the username or password${cmd}. On cPanel, use the FULL email address as the username, and the mailbox password (not your cPanel login). Server said: ${resp}`
  }
  if (code === 'ECONNREFUSED') {
    return `Connection refused — the host or port is wrong, or the server is not accepting SMTP there. Try port 465 (SSL) or 587 (TLS). Server said: ${resp}`
  }
  // "Greeting never received" is NOT a blocked port — the TCP connection
  // succeeded but the TLS mode was wrong for that port, so both ends waited
  // on each other. Distinguish it, because the advice is completely different.
  if (/greeting never received/i.test(resp)) {
    return `Connected to the server, but it never sent an SMTP greeting — this is a TLS mismatch, not a blocked port. Port 465 requires SSL/TLS while 587 requires STARTTLS. Both combinations were tried automatically. Confirm the host and port with your hosting provider (in cPanel: Email Accounts → Connect Devices). Details: ${resp}`
  }
  if (code === 'ETIMEDOUT' || (code === 'ESOCKET' && /timed?.?out/i.test(resp))) {
    return `Connection timed out — the SMTP port is likely blocked by the network the app is hosted on, or the hostname is wrong. Details: ${resp}`
  }
  if (code === 'EDNS' || /ENOTFOUND|getaddrinfo/i.test(resp)) {
    return `The SMTP hostname could not be found. Check for typos — it is usually mail.yourdomain.com. Details: ${resp}`
  }
  if (/self.signed|certificate|SSL|TLS/i.test(resp)) {
    return `TLS/certificate problem — common on shared hosting with a shared certificate. Try enabling "Allow self-signed certificate", or switch between port 465 and 587. Details: ${resp}`
  }
  if (/550|551|553|relay/i.test(resp)) {
    return `The server refused to relay this message. The "From" address usually must match the SMTP mailbox. Server said: ${resp}`
  }
  return `SMTP error${cmd}: ${resp}`
}

/** Build a transport for a given port/TLS combination. */
async function makeTransport(port: number, secure: boolean) {
  const g = garageSettings
  const nodemailer = (await import('nodemailer')).default
  return nodemailer.createTransport({
    host: g.smtpHost,
    port,
    secure,
    auth: { user: g.smtpUser, pass: g.smtpPassword },
    tls: { rejectUnauthorized: g.smtpRejectUnauthorized !== false },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 25000,
  })
}

/** A handshake-level failure that a different TLS mode might fix. */
function isHandshakeFailure(err: any): boolean {
  const code = err?.code || ''
  const msg  = String(err?.message || '')
  return code === 'ETIMEDOUT' || code === 'ESOCKET' || code === 'ECONNRESET' ||
         /greeting never received|wrong version number|record layer|SSL routines/i.test(msg)
}

/**
 * Candidate port/TLS combinations to try, best guess first.
 * If the configured pairing fails at the handshake, we retry the standard
 * alternative rather than making the user diagnose TLS semantics themselves.
 */
function smtpCandidates(): { port: number; secure: boolean }[] {
  const primary = smtpPortAndSecure()
  const list = [primary]
  if (primary.port === 465)      list.push({ port: 587, secure: false })
  else if (primary.port === 587) list.push({ port: 465, secure: true })
  else list.push({ port: primary.port, secure: !primary.secure })
  return list
}

/** Verify SMTP credentials without sending a message (nodemailer verify()). */
export async function verifySmtp(): Promise<SendResult> {
  const g = garageSettings
  if (g.emailProvider !== 'smtp') {
    return { ok: false, status: 'unsupported', message: 'SMTP is not the selected provider.' }
  }
  const cfg = emailConfigured()
  if (!cfg.ok) return { ok: false, status: 'disabled', message: cfg.reason! }

  const candidates = smtpCandidates()
  let lastErr: any = null

  for (let i = 0; i < candidates.length; i++) {
    const { port, secure } = candidates[i]
    let transport: any = null
    try {
      transport = await makeTransport(port, secure)
      await transport.verify()
      transport.close()
      const mode = secure ? 'SSL/TLS' : 'STARTTLS'
      // If a fallback worked, persist it so normal sends use it too.
      if (i > 0) {
        updateGarageSettings({ smtpPort: port, smtpSecure: secure })
        return {
          ok: true, status: 'sent',
          message: `Connected to ${g.smtpHost}:${port} (${mode}) and authenticated successfully. ` +
                   `Note: port ${candidates[0].port} did not respond, so the settings were switched to port ${port} and saved.`,
        }
      }
      return { ok: true, status: 'sent', message: `Connected to ${g.smtpHost}:${port} (${mode}) and authenticated successfully.` }
    } catch (err: any) {
      if (transport) { try { transport.close() } catch {} }
      lastErr = err
      // Credentials/relay errors mean the transport is fine — stop retrying.
      if (!isHandshakeFailure(err)) break
    }
  }
  return { ok: false, status: 'failed', message: explainSmtpError(lastErr) }
}

/** Send through a standard SMTP server (cPanel, Google Workspace, etc.). */
async function sendViaSmtp(opts: {
  to: string; toName?: string; subject: string; html: string
  text?: string; attachments?: Attachment[]; replyTo?: string
}): Promise<SendResult> {
  const g = garageSettings
  const message = {
    from: { name: fromName(), address: fromAddress() },
    to: opts.toName ? { name: opts.toName, address: opts.to } : opts.to,
    subject: opts.subject,
    text: opts.text || htmlToText(opts.html),
    html: opts.html,
    replyTo: opts.replyTo || g.email || undefined,
    attachments: (opts.attachments || []).map(a => ({
      filename: a.filename,
      content: Buffer.from(a.content, 'base64'),
      contentType: a.type || 'application/pdf',
    })),
  }

  const candidates = smtpCandidates()
  let lastErr: any = null

  for (let i = 0; i < candidates.length; i++) {
    const { port, secure } = candidates[i]
    let transport: any = null
    try {
      transport = await makeTransport(port, secure)
      const info = await transport.sendMail(message)
      transport.close()

      // A rejected recipient still resolves — surface it rather than claiming success.
      if (info.rejected && info.rejected.length) {
        return { ok: false, status: 'failed', message: `The mail server rejected: ${info.rejected.join(', ')}` }
      }
      // Remember a working fallback so later sends go straight there.
      if (i > 0) updateGarageSettings({ smtpPort: port, smtpSecure: secure })
      return { ok: true, status: 'sent', message: `Email accepted by ${g.smtpHost}:${port} (${info.messageId || 'queued'}).` }
    } catch (err: any) {
      if (transport) { try { transport.close() } catch {} }
      lastErr = err
      if (!isHandshakeFailure(err)) break
    }
  }
  return { ok: false, status: 'failed', message: explainSmtpError(lastErr) }
}

/**
 * Deliver an email through the configured provider.
 * Never throws — always returns a structured SendResult the UI can surface.
 */
export async function sendEmail(opts: {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  attachments?: Attachment[]
  replyTo?: string
}): Promise<SendResult> {
  const cfg = emailConfigured()
  if (!cfg.ok) return { ok: false, status: 'disabled', message: cfg.reason! }

  const g = garageSettings

  // ── Route to the configured transport ──
  if (g.emailProvider === 'smtp') return sendViaSmtp(opts)

  const payload: any = {
    personalizations: [{ to: [{ email: opts.to, ...(opts.toName ? { name: opts.toName } : {}) }] }],
    from: { email: fromAddress(), name: fromName() },
    subject: opts.subject,
    content: [
      { type: 'text/plain', value: opts.text || htmlToText(opts.html) },
      { type: 'text/html',  value: opts.html },
    ],
  }
  if (opts.replyTo || g.email) payload.reply_to = { email: opts.replyTo || g.email }
  if (opts.attachments?.length) {
    payload.attachments = opts.attachments.map(a => ({
      filename: a.filename,
      content: a.content,
      type: a.type || 'application/pdf',
      disposition: 'attachment',
    }))
  }

  try {
    const res = await fetch(SENDGRID_BASE + '/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + g.emailApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (res.status === 202) {
      return { ok: true, status: 'sent', message: 'Email accepted by SendGrid.', providerStatus: 202 }
    }

    // Surface SendGrid's own error text — far more useful than a bare status.
    let detail = ''
    try {
      const body: any = await res.json()
      detail = (body?.errors || []).map((e: any) => e.message).filter(Boolean).join('; ')
    } catch { /* non-JSON error body */ }

    const hint =
      res.status === 401 ? ' — check the API key is correct and has "Mail Send" permission.'
      : res.status === 403 ? ' — the From address is likely not a verified sender in SendGrid.'
      : ''

    return {
      ok: false,
      status: 'failed',
      message: `SendGrid rejected the message (HTTP ${res.status})${detail ? ': ' + detail : ''}${hint}`,
      providerStatus: res.status,
    }
  } catch (err: any) {
    return { ok: false, status: 'failed', message: 'Could not reach SendGrid: ' + (err?.message || String(err)) }
  }
}
