import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { logger } from '@/lib/logger';
import { writeProcessingRecord } from '@/lib/privacy-register';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(2),
  invoices: z.string().min(1),
  message: z.string().optional(),
  phone: z.string().optional(),
  acceptPrivacy: z.literal(true),
  marketingEmail: z.boolean().optional(),
  marketingPhone: z.boolean().optional(),
  consentVersion: z.string().min(3).max(120).default('lead-form-v1'),
  pagePath: z.string().min(1).max(200).optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(`contact:${ip}`, { windowMs: 60_000, max: 8, blockMs: 10 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }
  try {
    const json = await req.json();
    const lead = schema.parse(json);
    const ipAddress = ip === 'unknown' ? null : ip;
    const userAgent = req.headers.get('user-agent');

    const createdLead = await prisma.$transaction(async (tx) => {
      const savedLead = await tx.lead.create({
        data: {
          name: lead.name,
          email: lead.email,
          company: lead.company,
          invoices: lead.invoices,
          message: lead.message ?? null,
          phone: lead.phone ?? null,
          acceptPrivacy: lead.acceptPrivacy,
          marketingEmail: lead.marketingEmail ?? false,
          marketingPhone: lead.marketingPhone ?? false,
          source: lead.pagePath ? `demo_form:${lead.pagePath}` : 'demo_form',
        },
      });

      const consentRows = [];
      if (lead.marketingEmail) {
        consentRows.push({
          leadId: savedLead.id,
          channel: 'EMAIL' as const,
          consentText:
            'Wyrażam zgodę na przesyłanie informacji handlowych drogą elektroniczną (e-mail) o produktach i usługach Scopeo.',
          consentVersion: lead.consentVersion,
          formPath: lead.pagePath ?? null,
          ipAddress,
          userAgent,
        });
      }
      if (lead.marketingPhone) {
        consentRows.push({
          leadId: savedLead.id,
          channel: 'PHONE' as const,
          consentText: 'Wyrażam zgodę na kontakt telefoniczny w sprawach handlowych.',
          consentVersion: lead.consentVersion,
          formPath: lead.pagePath ?? null,
          ipAddress,
          userAgent,
        });
      }

      if (consentRows.length > 0) {
        await tx.leadMarketingConsent.createMany({ data: consentRows });
      }

      return savedLead;
    });
    const privacyOrgId = process.env.DEFAULT_PRIVACY_ORGANIZATION_ID;
    if (privacyOrgId) {
      await writeProcessingRecord({
        organizationId: privacyOrgId,
        eventType: 'LEAD_CAPTURED',
        subjectRef: createdLead.email,
        legalBasis: 'art. 6 ust. 1 lit. a RODO',
        payload: {
          leadId: createdLead.id,
          marketingEmail: lead.marketingEmail ?? false,
          marketingPhone: lead.marketingPhone ?? false,
        },
      });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const salesInbox = process.env.SALES_INBOX_EMAIL;
    const fromEmail = process.env.LEADS_FROM_EMAIL;
    if (!resendKey || !salesInbox || !fromEmail) {
      logger.error({ context: 'contact', message: 'Missing email envs for lead notification' });
      return NextResponse.json(
        { error: 'Lead saved, but email integration is not configured.' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendKey);
    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: salesInbox,
      replyTo: lead.email,
      subject: `Nowy lead demo: ${lead.company}`,
      text: [
        `Lead ID: ${createdLead.id}`,
        `Imię i nazwisko: ${lead.name}`,
        `Email: ${lead.email}`,
        `Telefon: ${lead.phone ?? '-'}`,
        `Firma: ${lead.company}`,
        `Liczba faktur: ${lead.invoices}`,
        `Zgoda RODO: ${lead.acceptPrivacy ? 'tak' : 'nie'}`,
        `Marketing email: ${lead.marketingEmail ? 'tak' : 'nie'}`,
        `Marketing telefon: ${lead.marketingPhone ? 'tak' : 'nie'}`,
        `Wersja zgód: ${lead.consentVersion}`,
        `Źródło formularza: ${lead.pagePath ?? '-'}`,
        `IP: ${ipAddress ?? '-'}`,
        `Wiadomość: ${lead.message ?? '-'}`,
      ].join('\n'),
    });

    if (emailResult.error) {
      logger.error({
        context: 'contact',
        message: 'Failed to send lead notification',
        error: emailResult.error.message,
      });
      return NextResponse.json(
        { error: 'Lead saved, but failed to send notification email.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    logger.error({
      context: 'contact',
      message: 'Failed to process lead',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to process lead' }, { status: 500 });
  }
}
