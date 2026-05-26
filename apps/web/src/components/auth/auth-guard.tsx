'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { getMe, logout, type AuthUser } from '@/services/auth';

type AuthGuardProps = {
  children: (user: AuthUser) => ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const nextUser = await getMe();

        if (isMounted) {
          setUser(nextUser);
        }
      } catch {
        logout();
        router.replace('/login');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-arena-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-5xl rounded-2xl border border-arena-700 bg-arena-900 p-6 text-sm text-zinc-400">
          Carregando sessao...
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return children(user);
}
