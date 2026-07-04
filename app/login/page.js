'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BrainCircuit, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  const handleGoogleLogin = () => {
    // DO NOT hardcode; DO NOT add redirect fallbacks — breaks auth.
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.35]" />
      <div className="relative flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="inline-flex items-center gap-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <ThemeToggle />
      </div>
      <div className="relative flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card">
              <BrainCircuit className="h-5 w-5 text-brand" />
            </div>
            <span className="font-mono text-lg font-semibold tracking-tight">AI Memory</span>
          </div>
          <div className="rounded-md border border-border bg-card p-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Sign in</p>
            <h1 className="mt-3 text-3xl font-medium tracking-tight">Continue to your workspace</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Save memory packages, revisit your project history, and move context between any AI — securely tied to your account.
            </p>
            <button
              onClick={handleGoogleLogin}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-md border border-border bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.3 9.14 4.75 12 4.75Z" />
              </svg>
              Continue with Google
            </button>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to keep your pasted transcripts private to your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
