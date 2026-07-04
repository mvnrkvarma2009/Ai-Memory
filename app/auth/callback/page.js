'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { BrainCircuit } from 'lucide-react';

function CallbackInner() {
  const router = useRouter();
  const { setUser, checkAuth } = useAuth();
  const [error, setError] = useState(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    // The Emergent OAuth broker returns session_id in the URL fragment.
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      // Fallback — maybe someone just visited /dashboard with no hash while logged in already.
      checkAuth().finally(() => router.replace('/dashboard'));
      return;
    }

    (async () => {
      try {
        const res = await api.post('/auth/session', {}, { headers: { 'X-Session-ID': sessionId } });
        setUser(res.data);
        // Clean the hash out of the URL then navigate to dashboard.
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/dashboard');
        }
        router.replace('/dashboard');
      } catch (e) {
        console.error('session exchange failed', e);
        setError('Sign-in failed. Please try again.');
        setTimeout(() => router.replace('/login'), 1600);
      }
    })();
  }, [router, setUser, checkAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <BrainCircuit className="h-8 w-8 animate-pulse text-brand" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {error || 'Establishing memory link…'}
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
