'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BrainCircuit } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <BrainCircuit className="h-8 w-8 animate-pulse text-brand" />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Verifying session…</p>
        </div>
      </div>
    );
  }
  if (!user) return null;
  return children;
}
