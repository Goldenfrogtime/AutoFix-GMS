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

import { garageSettings } from './store.js'

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
  if (!g.emailEnabled)                return { ok: false, reason: 'Email sending is disabled in Settings → Notifications.' }
  if (g.emailProvider !== 'sendgrid') {
    return g.emailProvider === 'none'
      ? { ok: false, reason: 'No email provider selected. Choose SendGrid in Settings → Notifications.' }
      : { ok: false, reason: `Provider "${g.emailProvider}" is not implemented yet — only SendGrid is supported.` }
  }
  if (!g.emailApiKey) return { ok: false, reason: 'SendGrid API key is missing. Add it in Settings → Notifications.' }
  if (!g.emailFrom)   return { ok: false, reason: 'A verified "From" address is required. Set it in Settings → Notifications.' }
  return { ok: true }
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
  const payload: any = {
    personalizations: [{ to: [{ email: opts.to, ...(opts.toName ? { name: opts.toName } : {}) }] }],
    from: { email: g.emailFrom, name: g.garageName || g.tradingName || 'Garage' },
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
