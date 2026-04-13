import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/schema';
import { signIn } from '@/lib/auth';

async function registerAction(formData: FormData) {
  'use server';
  const parsed = registerSchema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    organizationName: formData.get('organizationName'),
    slug: formData.get('slug'),
  });
  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      passwordHash,
      memberships: {
        create: {
          role: 'OWNER',
          organization: {
            create: {
              name: parsed.organizationName,
              slug: parsed.slug,
              regionCode: 'PL',
            },
          },
        },
      },
    },
  });
  await signIn('credentials', {
    email: user.email,
    password: parsed.password,
    redirectTo: '/dashboard',
  });
}

async function loginAction(formData: FormData) {
  'use server';
  await signIn('credentials', {
    email: String(formData.get('email') || ''),
    password: String(formData.get('password') || ''),
    redirectTo: '/dashboard',
  });
}

export default function LoginPage() {
  return (
    <main className="container app-page">
      <div className="nav" style={{ marginBottom: 28 }}>
        <Link href="/" className="badge" style={{ textDecoration: 'none' }}>
          ← Scopeo · strona główna
        </Link>
      </div>

      <h1 className="title">Logowanie i rejestracja</h1>
      <p className="subtitle app-intro" style={{ maxWidth: 720 }}>
        Jedno konto = jedna organizacja (tenant). Po rejestracji uzupełnij onboarding (profil KSeF i
        raportowanie), potem w dashboardzie: import XML faktur, import faktorów emisji, review linii i
        kalkulacja scope 1–3 zgodnie z GHG Protocol.
      </p>

      <div className="grid grid-2" style={{ marginTop: 28 }}>
        <form action={loginAction} className="card section">
          <h2>Logowanie</h2>
          <p className="app-muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 14 }}>
            Wpisz email i hasło przypisane do konta w Scopeo.
          </p>
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
        </form>

        <form action={registerAction} className="card section">
          <h2>Nowy tenant (właściciel)</h2>
          <p className="app-muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 14 }}>
            Tworzysz organizację i pierwsze konto z rolą OWNER. Slug używamy w adresie wewnętrznym
            (np. <code style={{ fontSize: 13 }}>moja-firma</code>) — małe litery, cyfry, myślnik.
          </p>
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
    </main>
  );
}
