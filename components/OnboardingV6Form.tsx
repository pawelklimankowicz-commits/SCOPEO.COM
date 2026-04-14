'use client';

import { useState } from 'react';
import type { CarbonProfile } from '@prisma/client';

export default function OnboardingV6Form({
  initial,
}: {
  initial?: CarbonProfile | null;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const fd = new FormData(e.currentTarget);
    const body = {
      companyName: String(fd.get('companyName') || ''),
      reportingYear: Number(fd.get('reportingYear')),
      baseYear: Number(fd.get('baseYear')),
      boundaryApproach: String(fd.get('boundaryApproach') || 'operational_control'),
      industry: String(fd.get('industry') || ''),
      ksefToken: String(fd.get('ksefToken') || ''),
      supportsMarketBased: fd.get('supportsMarketBased') === 'on',
      hasGreenContracts: fd.get('hasGreenContracts') === 'on',
      businessTravelIncluded: fd.get('businessTravelIncluded') === 'on',
      employeeCommutingIncluded: fd.get('employeeCommutingIncluded') === 'on',
      notes: fd.get('notes') ? String(fd.get('notes')) : null,
    };
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) setMessage('Profil został zapisany.');
    else setMessage(data.error || 'Nie udało się zapisać profilu.');
  }

  const y = new Date().getFullYear();

  return (
    <form className="card section" onSubmit={onSubmit} style={{ marginTop: 24 }}>
      <h2 className="title" style={{ fontSize: 22, marginTop: 0 }}>
        Profil organizacji i KSeF
      </h2>
      <div className="grid grid-2">
        <div>
          <label>Nazwa firmy</label>
          <input
            name="companyName"
            required
            defaultValue={initial?.companyName ?? ''}
          />
        </div>
        <div>
          <label>Branża</label>
          <input
            name="industry"
            required
            defaultValue={initial?.industry ?? ''}
          />
        </div>
        <div>
          <label>Rok raportowania</label>
          <input
            name="reportingYear"
            type="number"
            required
            min={2020}
            max={2100}
            defaultValue={initial?.reportingYear ?? y}
          />
        </div>
        <div>
          <label>Rok bazowy</label>
          <input
            name="baseYear"
            type="number"
            required
            min={2020}
            max={2100}
            defaultValue={initial?.baseYear ?? y - 1}
          />
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <label>Podejście do granic organizacji (GHG)</label>
        <select
          name="boundaryApproach"
          required
          defaultValue={initial?.boundaryApproach ?? 'operational_control'}
        >
          <option value="operational_control">Kontrola operacyjna</option>
          <option value="financial_control">Kontrola finansowa</option>
          <option value="equity_share">Udział w kapitale</option>
        </select>
      </div>
      <div style={{ marginTop: 16 }}>
        <label>Token integracji KSeF (min. 10 znaków; przechowywany maskowany)</label>
        <input
          name="ksefToken"
          type="password"
          required
          minLength={10}
          autoComplete="off"
          placeholder="Wklej token testowy lub produkcyjny"
        />
      </div>
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            name="supportsMarketBased"
            type="checkbox"
            defaultChecked={initial?.supportsMarketBased ?? false}
          />
          Scope 2 market-based
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            name="hasGreenContracts"
            type="checkbox"
            defaultChecked={initial?.hasGreenContracts ?? false}
          />
          Kontrakty na energię zieloną
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            name="businessTravelIncluded"
            type="checkbox"
            defaultChecked={initial?.businessTravelIncluded ?? true}
          />
          Delegacje / travel w scope 3
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            name="employeeCommutingIncluded"
            type="checkbox"
            defaultChecked={initial?.employeeCommutingIncluded ?? false}
          />
          Dojazdy pracowników
        </label>
      </div>
      <div style={{ marginTop: 16 }}>
        <label>Notatki (opcjonalnie)</label>
        <textarea name="notes" rows={3} defaultValue={initial?.notes ?? ''} />
      </div>
      <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: 20 }}>
        {saving ? 'Zapisywanie…' : 'Zapisz profil'}
      </button>
      {message ? (
        <p className="subtitle" style={{ marginTop: 16, color: message.includes('zapis') ? '#7cf2b1' : '#ff9ca1' }}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
