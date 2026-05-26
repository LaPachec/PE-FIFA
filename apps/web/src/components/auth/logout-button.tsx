'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@/services/auth';

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-xl border border-arena-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-gold-500 hover:text-gold-400"
    >
      Sair
    </button>
  );
}
