import { env } from '../env';
import type { SessionUser } from './session';

/**
 * Fire-and-forget login alert via the Resend HTTP API. No-ops (with a log)
 * when RESEND_API_KEY or ALERT_EMAIL_TO are unset, so sign-in never fails
 * because email isn't configured.
 */
export async function sendLoginAlert(
  user: SessionUser,
  meta: { ip: string; userAgent: string },
): Promise<void> {
  if (!env.resendApiKey || !env.alertEmailTo) {
    console.log(`[login] ${user.name} <${user.email}> via ${user.provider} (email alert not configured)`);
    return;
  }
  const when = new Date().toLocaleString('en-GB', { timeZone: 'UTC', timeZoneName: 'short' });
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px">
      <h2 style="margin:0 0 12px">New sign-in to Fleetline</h2>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td><b>${escapeHtml(user.name)}</b></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${escapeHtml(user.email)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Provider</td><td>${user.provider}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Time</td><td>${when}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">IP</td><td>${escapeHtml(meta.ip)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Device</td><td>${escapeHtml(meta.userAgent)}</td></tr>
      </table>
    </div>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.alertEmailFrom,
        to: [env.alertEmailTo],
        subject: `Fleetline sign-in: ${user.name}`,
        html,
      }),
    });
    if (!res.ok) console.error(`[login] email alert failed (${res.status}): ${await res.text()}`);
  } catch (error) {
    console.error('[login] email alert error:', error);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
