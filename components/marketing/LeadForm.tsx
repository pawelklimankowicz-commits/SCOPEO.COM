'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

type Props = {
  variant?: 'default' | 'compact';
  idPrefix?: string;
};

export default function LeadForm({ variant = 'default', idPrefix = 'lead' }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const pathname = usePathname();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get('name') || ''),
      email: String(fd.get('email') || ''),
      company: String(fd.get('company') || ''),
      invoices: String(fd.get('invoices') || ''),
      message: String(fd.get('message') || ''),
      phone: String(fd.get('phone') || '').trim() || undefined,
      acceptPrivacy: fd.get('acceptPrivacy') === 'on',
      marketingEmail: fd.get('marketingEmail') === 'on',
      marketingPhone: fd.get('marketingPhone') === 'on',
      consentVersion: 'lead-form-v1-2026-04-14',
      pagePath: pathname,
    };
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      e.currentTarget.reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="mkt-form-success" role="status">
        Dziękujemy. Odezwiemy się w ciągu 1 dnia roboczego z propozycją terminu demo.
      </div>
    );
  }

  return (
    <form className="mkt-form" onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor={`${idPrefix}-name`}>Imię i nazwisko</label>
        <input id={`${idPrefix}-name`} name="name" type="text" required autoComplete="name" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-email`}>E-mail służbowy</label>
        <input id={`${idPrefix}-email`} name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-company`}>Firma</label>
        <input id={`${idPrefix}-company`} name="company" type="text" required autoComplete="organization" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-phone`}>Telefon (opcjonalnie)</label>
        <input id={`${idPrefix}-phone`} name="phone" type="tel" autoComplete="tel" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-invoices`}>Szacowana liczba faktur miesięcznie</label>
        <select id={`${idPrefix}-invoices`} name="invoices" required defaultValue="">
          <option value="" disabled>
            Wybierz przedział
          </option>
          <option value="0-50">do 50</option>
          <option value="51-100">51–100</option>
          <option value="101-200">101–200</option>
          <option value="201-500">201–500</option>
          <option value="501-1000">501–1000</option>
          <option value="1000+">powyżej 1000</option>
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-message`}>Wiadomość (opcjonalnie)</label>
        <textarea id={`${idPrefix}-message`} name="message" rows={variant === 'compact' ? 3 : 4} />
      </div>
      <div className="mkt-form-checkrow">
        <input
          id={`${idPrefix}-privacy`}
          name="acceptPrivacy"
          type="checkbox"
          required
          aria-required="true"
        />
        <label htmlFor={`${idPrefix}-privacy`} className="mkt-form-checklabel">
          Oświadczam, że zapoznałem(-am) się z{' '}
          <a href="/polityka-prywatnosci" className="mkt-link" target="_blank" rel="noopener noreferrer">
            polityką prywatności
          </a>{' '}
          i akceptuję przetwarzanie moich danych w celu obsługi zapytania. *
        </label>
      </div>
      <div className="mkt-form-checkrow">
        <input id={`${idPrefix}-mkt-email`} name="marketingEmail" type="checkbox" />
        <label htmlFor={`${idPrefix}-mkt-email`} className="mkt-form-checklabel">
          Wyrażam zgodę na przesyłanie informacji handlowych drogą elektroniczną (e-mail) o produktach i
          usługach Scopeo — zgodnie z polityką prywatności (opcjonalnie).
        </label>
      </div>
      <div className="mkt-form-checkrow">
        <input id={`${idPrefix}-mkt-phone`} name="marketingPhone" type="checkbox" />
        <label htmlFor={`${idPrefix}-mkt-phone`} className="mkt-form-checklabel">
          Wyrażam zgodę na kontakt telefoniczny w sprawach handlowych (opcjonalnie).
        </label>
      </div>
      <button type="submit" className="mkt-btn mkt-btn--primary" disabled={status === 'loading'}>
        {status === 'loading' ? 'Wysyłanie…' : 'Umów demo'}
      </button>
      {status === 'error' ? (
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#b91c1c' }}>
          Nie udało się wysłać. Spróbuj ponownie lub napisz na kontakt@scopeo.com
        </p>
      ) : null}
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
        Szczegóły zgód i wzorce dla formularzy:{' '}
        <a href="/klauzule-formularzy" className="mkt-link">
          klauzule formularzy
        </a>
        .
      </p>
    </form>
  );
}
