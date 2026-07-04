'use client';
import { use } from 'react';
import DashboardShell from '@/components/DashboardShell';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardItemPage({ params }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <DashboardShell activeId={id} />
    </ProtectedRoute>
  );
}
