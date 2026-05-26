import { AuthForm } from '@/components/auth/auth-form';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-arena-950 px-5 py-10 text-white">
      <section className="w-full max-w-md">
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
