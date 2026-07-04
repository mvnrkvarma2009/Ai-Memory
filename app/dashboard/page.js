'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  const router = useRouter();

  // If Emergent OAuth returned to /dashboard with #session_id=..., handle it here.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash?.includes('session_id=')) {
      router.replace('/auth/callback' + window.location.hash);
    }
  }, [router]);

  return (
    <ProtectedRoute>
      <DashboardShell activeId={null} />
    </ProtectedRoute>
  );
}
