'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      className="btn btn-secondary"
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      Wyloguj
    </button>
  );
}
