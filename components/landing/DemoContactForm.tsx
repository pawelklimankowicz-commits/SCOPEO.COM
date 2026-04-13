'use client';

import { useState } from 'react';

export default function DemoContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <form
      className="landing-demo-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <label>
        Imię i nazwisko
        <input name="name" type="text" required placeholder="Jan Kowalski" />
      </label>
      <label>
        Email
        <input name="email" type="email" required placeholder="jan@firma.pl" />
      </label>
      <label>
        Telefon
        <input name="phone" type="tel" placeholder="+48 …" />
      </label>
      <label>
        Wiadomość
        <textarea name="message" rows={3} placeholder="Krótko: czego potrzebujecie?" />
      </label>
      <button type="submit" className="landing-btn landing-btn-lime">
        {sent ? 'Dziękujemy — odezwiemy się' : 'Umów demo'}
      </button>
    </form>
  );
}
