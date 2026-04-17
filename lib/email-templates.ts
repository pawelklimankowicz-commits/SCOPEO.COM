type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderTemplate(input: {
  subject: string;
  greeting: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}): EmailTemplate {
  const safeGreeting = escapeHtml(input.greeting);
  const safeIntro = escapeHtml(input.intro);
  const safeCtaLabel = escapeHtml(input.ctaLabel);
  const safeUrl = escapeHtml(input.ctaUrl);
  const safeFooterNote = input.footerNote ? escapeHtml(input.footerNote) : '';

  const html = `<!doctype html>
<html lang="pl">
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px 8px;font-size:22px;font-weight:700;color:#0f172a;">Scopeo</td>
            </tr>
            <tr>
              <td style="padding:0 28px 8px;font-size:16px;line-height:1.6;color:#0f172a;">${safeGreeting}</td>
            </tr>
            <tr>
              <td style="padding:0 28px 12px;font-size:15px;line-height:1.7;color:#334155;">${safeIntro}</td>
            </tr>
            <tr>
              <td style="padding:12px 28px 8px;">
                <a href="${safeUrl}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;border-radius:6px;padding:14px 28px;">${safeCtaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0;font-size:13px;line-height:1.7;color:#475569;">
                Jeśli przycisk nie działa, skopiuj ten link: <a href="${safeUrl}" style="color:#0f766e;word-break:break-all;">${safeUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 28px 0;font-size:13px;line-height:1.7;color:#475569;">Link ważny 24 godziny.</td>
            </tr>
            ${
              safeFooterNote
                ? `<tr><td style="padding:6px 28px 0;font-size:13px;line-height:1.7;color:#475569;">${safeFooterNote}</td></tr>`
                : ''
            }
            <tr>
              <td style="padding:18px 28px 24px;font-size:12px;line-height:1.6;color:#64748b;border-top:1px solid #f1f5f9;margin-top:12px;">
                Scopeo · scopeo.pl · Nie zamawiałeś konta? Zignoruj tę wiadomość.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${input.greeting}

${input.intro}

${input.ctaLabel}: ${input.ctaUrl}

Jeśli przycisk nie działa, skopiuj ten link: ${input.ctaUrl}
Link ważny 24 godziny.
${input.footerNote ? `${input.footerNote}\n` : ''}
Scopeo · scopeo.pl · Nie zamawiałeś konta? Zignoruj tę wiadomość.`;

  return { subject: input.subject, html, text };
}

export function verificationEmail(name: string, verifyUrl: string): EmailTemplate {
  return renderTemplate({
    subject: 'Potwierdź adres email — Scopeo',
    greeting: `Cześć ${name},`,
    intro: 'Kliknij przycisk poniżej, aby potwierdzić adres email i aktywować konto.',
    ctaLabel: 'Potwierdź email',
    ctaUrl: verifyUrl,
  });
}

export function trialEndingEmail(name: string, daysLeft: number, billingUrl: string): EmailTemplate {
  return renderTemplate({
    subject: `Twój trial Scopeo kończy się za ${daysLeft} dni`,
    greeting: `Cześć ${name},`,
    intro: `Twój trial Scopeo kończy się za ${daysLeft} dni. Wybierz plan, aby zachować ciągłość dostępu do danych i funkcji.`,
    ctaLabel: 'Wybierz plan',
    ctaUrl: billingUrl,
  });
}

export function paymentFailedEmail(name: string, portalUrl: string): EmailTemplate {
  return renderTemplate({
    subject: 'Płatność za Scopeo nie powiodła się',
    greeting: `Cześć ${name},`,
    intro: 'Nie udało się pobrać płatności za subskrypcję Scopeo. Zaktualizuj metodę płatności, aby uniknąć przerwy w dostępie.',
    ctaLabel: 'Zaktualizuj metodę płatności',
    ctaUrl: portalUrl,
  });
}
