'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  const router = useRouter();

  // Defensive: if a stray Emergent OAuth callback lands on /dashboard#session_id=...
  // (e.g. an old bookmarked redirect), forward it to /auth/callback so
  // ProtectedRoute doesn't kick us to /login before session exchange.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash?.includes('session_id=')) {
      window.location.replace('/auth/callback' + window.location.hash);
    }
  }, [router]);

  // If the hash is present, don't render ProtectedRoute at all \u2014 avoid the race.
  if (typeof window !== 'undefined' && window.location.hash?.includes('session_id=')) {
    return null;
  }

  return (
    <ProtectedRoute>
      <DashboardShell activeId={null} />
    </ProtectedRoute>
  );
}
