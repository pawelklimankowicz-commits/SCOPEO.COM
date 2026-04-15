'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!token) {
    return (
      <main style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Reset hasła</h1>
        {status === 'sent' ? (
          <p style={{ color: '#16a34a' }}>
            Jeśli konto istnieje, wysłaliśmy link resetujący na podany adres email.
          </p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setStatus('loading');
              const res = await fetch('/api/auth/password-reset/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              });
              setStatus(res.ok ? 'sent' : 'error');
            }}
          >
            <label style={{ display: 'block', marginBottom: 8 }}>
              Adres email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  marginTop: 4,
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                }}
              />
            </label>
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                marginTop: 16,
                padding: '10px 20px',
                background: '#2563eb',
                color: '#fff',
                border: 0,
                borderRadius: 6,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              {status === 'loading' ? 'Wysyłanie...' : 'Wyślij link resetujący'}
            </button>
          </form>
        )}
        <p style={{ marginTop: 16, fontSize: 13 }}>
          <a href="/login">Wróć do logowania</a>
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Ustaw nowe hasło</h1>
      {status === 'done' ? (
        <p style={{ color: '#16a34a' }}>
          Hasło zostało zmienione. <a href="/login">Zaloguj się</a>
        </p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (password !== confirm) {
              setErrorMsg('Hasła nie są zgodne.');
              return;
            }
            if (password.length < 12) {
              setErrorMsg('Hasło musi mieć co najmniej 12 znaków.');
              return;
            }
            setStatus('loading');
            setErrorMsg('');
            const res = await fetch('/api/auth/password-reset/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (res.ok) setStatus('done');
            else {
              setStatus('error');
              setErrorMsg(data.error ?? 'Błąd — spróbuj ponownie.');
            }
          }}
        >
          {errorMsg && <p style={{ color: '#dc2626', marginBottom: 12 }}>{errorMsg}</p>}
          <label style={{ display: 'block', marginBottom: 8 }}>
            Nowe hasło (min. 12 znaków)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={12}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                marginTop: 4,
                border: '1px solid #cbd5e1',
                borderRadius: 6,
              }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Powtórz hasło
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                marginTop: 4,
                border: '1px solid #cbd5e1',
                borderRadius: 6,
              }}
            />
          </label>
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              marginTop: 16,
              padding: '10px 20px',
              background: '#2563eb',
              color: '#fff',
              border: 0,
              borderRadius: 6,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {status === 'loading' ? 'Zapisywanie...' : 'Zmień hasło'}
          </button>
        </form>
      )}
    </main>
  );
}
