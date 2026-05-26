'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { getMe, login, register } from '@/services/auth';
import { getStoredAuthToken } from '@/services/api-client';

type AuthFormProps = {
  mode: 'login' | 'register';
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    async function redirectIfAuthenticated() {
      if (!getStoredAuthToken()) {
        setIsCheckingSession(false);
        return;
      }

      try {
        await getMe();
        router.replace('/dashboard');
      } catch {
        setIsCheckingSession(false);
      }
    }

    void redirectIfAuthenticated();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      } else {
        await login({
          email: email.trim(),
          password,
        });
      }

      router.replace('/dashboard');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Nao foi possivel concluir a autenticacao.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <div className="rounded-2xl border border-arena-700 bg-arena-900 p-6 text-sm text-zinc-400">
        Verificando sessao...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-arena-700 bg-arena-900 p-6 sm:p-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
          FIFA Tournament Manager
        </span>
        <h1 className="mt-4 text-3xl font-bold text-white">
          {isRegister ? 'Criar conta' : 'Entrar'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {isRegister
            ? 'Cadastre-se para criar e gerenciar seus campeonatos.'
            : 'Acesse sua conta para continuar gerenciando seus campeonatos.'}
        </p>
      </div>

      <div className="mt-8 grid gap-5">
        {isRegister ? (
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-semibold text-zinc-100">
              Nome
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-arena-700 bg-arena-950 px-4 py-3 text-white outline-none transition focus:border-gold-500"
              placeholder="Seu nome"
              required
            />
          </div>
        ) : null}

        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-semibold text-zinc-100">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-arena-700 bg-arena-950 px-4 py-3 text-white outline-none transition focus:border-gold-500"
            placeholder="voce@email.com"
            required
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-zinc-100">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-xl border border-arena-700 bg-arena-950 px-4 py-3 text-white outline-none transition focus:border-gold-500"
            placeholder="Minimo de 6 caracteres"
            minLength={isRegister ? 6 : undefined}
            required
          />
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-arena-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Enviando...' : isRegister ? 'Criar conta' : 'Entrar'}
      </button>

      <p className="mt-5 text-center text-sm text-zinc-400">
        {isRegister ? 'Ja tem uma conta?' : 'Ainda nao tem conta?'}{' '}
        <Link
          href={isRegister ? '/login' : '/register'}
          className="font-semibold text-gold-400 hover:text-gold-300"
        >
          {isRegister ? 'Entrar' : 'Criar conta'}
        </Link>
      </p>
    </form>
  );
}
