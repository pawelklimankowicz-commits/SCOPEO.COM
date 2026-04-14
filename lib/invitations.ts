import crypto from 'crypto';
import { Resend } from 'resend';

export function createInvitationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export function hashInvitationToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function sendInvitationEmail(input: {
  email: string;
  token: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const inviteUrl = appUrl
    ? `${appUrl.replace(/\/$/, '')}/login?inviteToken=${encodeURIComponent(input.token)}`
    : null;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.LEADS_FROM_EMAIL;
  if (!inviteUrl || !resendKey || !fromEmail) {
    throw new Error('Email service not configured for invitations');
  }
  const resend = new Resend(resendKey);
  const result = await resend.emails.send({
    from: fromEmail,
    to: input.email.toLowerCase(),
    subject: 'Zaproszenie do Scopeo',
    text: `Otrzymujesz zaproszenie do organizacji w Scopeo. Użyj linku: ${inviteUrl}`,
  });
  if (result.error) {
    throw new Error(`Failed to send invitation email: ${result.error.message}`);
  }
  return result;
}
