'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';

export default function AuthForms() {
  const [message, setMessage] = useState('');

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase();
    const password = String(formData.get('password') || '');
    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl: '/dashboard',
      redirect: true,
    });
    if (result?.error) setMessage(result.error);
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      password: String(formData.get('password') || ''),
      organizationName: String(formData.get('organizationName') || ''),
      slug: String(formData.get('slug') || ''),
    };
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) {
      setMessage(data.error || 'Nie udało się utworzyć konta.');
      return;
    }
    await signIn('credentials', {
      email: payload.email,
      password: payload.password,
      callbackUrl: '/dashboard',
      redirect: true,
    });
  }

  async function handleAcceptInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const inviteToken = String(formData.get('inviteToken') || '');
    const name = String(formData.get('name') || '');
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase();
    const password = String(formData.get('password') || '');
    const res = await fetch('/api/invites/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteToken, name, email, password }),
    });
    const data = await res.json();
    if (!data.ok) {
      setMessage(data.error || 'Nie udało się zaakceptować zaproszenia.');
      return;
    }
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/dashboard',
      redirect: true,
    });
  }

  return (
    <main className="container app-page">
      <div className="nav" style={{ marginBottom: 28 }}>
        <Link href="/" className="badge" style={{ textDecoration: 'none' }}>
          ← Scopeo · strona główna
        </Link>
      </div>

      <h1 className="title">Logowanie i rejestracja</h1>
      <p className="subtitle app-intro" style={{ maxWidth: 720 }}>
        Jedno konto = jedna organizacja (tenant). Po rejestracji uzupełnij onboarding.
      </p>

      <div className="grid grid-2" style={{ marginTop: 28 }}>
        <form onSubmit={handleLogin} className="card section">
          <h2>Logowanie</h2>
          <div>
            <label>Email</label>
            <input name="email" type="email" required autoComplete="email" />
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Hasło</label>
            <input name="password" type="password" required autoComplete="current-password" />
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: 18 }}>
            Zaloguj
          </button>
          <p style={{ marginTop: 12, fontSize: 13 }}>
            <a href="/reset-password">Zapomniałeś hasła?</a>
          </p>
        </form>

        <form onSubmit={handleRegister} className="card section">
          <h2>Nowy tenant (właściciel)</h2>
          <div>
            <label>Imię i nazwisko</label>
            <input name="name" required autoComplete="name" />
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Email</label>
            <input name="email" type="email" required autoComplete="email" />
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Hasło (min. 8 znaków)</label>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Nazwa organizacji</label>
            <input name="organizationName" required />
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Slug organizacji</label>
            <input name="slug" required pattern="[a-z0-9-]+" placeholder="np. moja-firma" />
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: 18 }}>
            Utwórz konto i tenant
          </button>
        </form>
      </div>

      <form onSubmit={handleAcceptInvite} className="card section" style={{ marginTop: 20 }}>
        <h2>Akceptacja zaproszenia</h2>
        <div>
          <label>Token zaproszenia</label>
          <input name="inviteToken" required />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Imię i nazwisko</label>
          <input name="name" required />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Email</label>
          <input name="email" type="email" required autoComplete="email" />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Hasło</label>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <button className="btn btn-primary" type="submit" style={{ marginTop: 18 }}>
          Akceptuj zaproszenie
        </button>
      </form>

      {message ? (
        <p className="subtitle" style={{ marginTop: 16, color: '#ff9ca1' }}>
          {message}
        </p>
      ) : null}
    </main>
  );
}
