import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeProcessingRecord } from '@/lib/privacy-register';
import { Resend } from 'resend';
import { logger } from '@/lib/logger';

function canManage(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const role = (session.user as any).role as string | null | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { requestId } = await context.params;
  const request = await prisma.gdprRequest.findFirst({
    where: { id: requestId, organizationId },
  });
  if (!request) return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 });
  if (request.status === 'COMPLETED') {
    return NextResponse.json({ ok: true, request });
  }

  let affectedUsers = 0;
  let affectedLeads = 0;
  let affectedSuppliers = 0;
  let affectedInvoiceLines = 0;
  const email = request.subjectEmail.toLowerCase();

  if (request.type === 'ERASURE') {
    const users = await prisma.user.findMany({
      where: {
        email,
        memberships: { some: { organizationId } },
      },
      select: { id: true, email: true },
    });
    for (const user of users) {
      if (user.id === session.user.id) continue;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: `deleted-${user.id}@deleted.local`,
          name: 'Deleted User',
          image: null,
          passwordHash: null,
        },
      });
      affectedUsers += 1;
    }

    const leadsResult = await prisma.lead.updateMany({
      where: { email },
      data: {
        email: `deleted+${Date.now()}@deleted.local`,
        name: 'Deleted Lead',
        phone: null,
        message: null,
        company: 'Deleted',
      },
    });
    affectedLeads = leadsResult.count;

    const localPart = email.split('@')[0] ?? '';
    const shouldAnonymizeInvoices = process.env.GDPR_ERASURE_ANONYMIZE_INVOICES === 'true';
    if (shouldAnonymizeInvoices && localPart.length >= 3) {
      const suppliersToAnonymize = await prisma.supplier.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: email, mode: 'insensitive' } },
            { name: { contains: localPart, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      const supplierIds = suppliersToAnonymize.map((s) => s.id);

      const supplierUpdate = await prisma.supplier.updateMany({
        where: {
          id: { in: supplierIds },
        },
        data: { name: 'Deleted Supplier', taxId: '' },
      });
      affectedSuppliers = supplierUpdate.count;

      if (supplierIds.length > 0) {
        const lineUpdate = await prisma.invoiceLine.updateMany({
          where: {
            invoice: { organizationId, supplierId: { in: supplierIds } },
          },
          data: { description: '[ANONYMIZED]' },
        });
        affectedInvoiceLines = lineUpdate.count;
      }
    }
  }

  const updatedRequest = await prisma.gdprRequest.update({
    where: { id: request.id },
    data: {
      status: 'COMPLETED',
      processedAt: new Date(),
      processedByUserId: session.user.id as string,
    },
  });

  await writeProcessingRecord({
    organizationId,
    actorUserId: session.user.id as string,
    eventType: 'GDPR_REQUEST_EXECUTED',
    subjectRef: request.subjectEmail,
    legalBasis: 'art. 17 RODO',
    payload: {
      requestId: request.id,
      type: request.type,
      affectedUsers,
      affectedLeads,
      affectedSuppliers,
      affectedInvoiceLines,
      invoiceAnonymizationPolicy: process.env.GDPR_ERASURE_ANONYMIZE_INVOICES === 'true',
    },
  });

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.LEADS_FROM_EMAIL;
  if (resendKey && fromEmail && request.subjectEmail) {
    const resend = new Resend(resendKey);
    void resend.emails
      .send({
        from: fromEmail,
        to: request.subjectEmail,
        subject: 'Potwierdzenie realizacji wniosku RODO - Scopeo',
        text:
          request.type === 'ERASURE'
            ? `Informujemy, ze Twoj wniosek o usuniecie danych osobowych (nr ${request.id}) zostal zrealizowany. Twoje dane zostaly zanonimizowane zgodnie z wymogami RODO.`
            : `Informujemy, ze Twoj wniosek o dostep do danych osobowych (nr ${request.id}) zostal zrealizowany. Skontaktuj sie z nami, jesli masz pytania.`,
      })
      .then((emailResult) => {
        if (!emailResult.error) return;
        logger.warn({
          context: 'gdpr_execute',
          message: 'Failed to send GDPR completion confirmation',
          requestId: request.id,
          error: emailResult.error.message,
        });
      })
      .catch((error: unknown) => {
        logger.warn({
          context: 'gdpr_execute',
          message: 'Failed to send GDPR completion confirmation',
          requestId: request.id,
          error: error instanceof Error ? error.message : 'Unknown resend error',
        });
      });
  }

  return NextResponse.json({
    ok: true,
    request: updatedRequest,
    affectedUsers,
    affectedLeads,
    affectedSuppliers,
    affectedInvoiceLines,
  });
}
