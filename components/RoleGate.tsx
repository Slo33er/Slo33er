'use client';

import { storage } from '@/lib/storage';
import { Role } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Simple client-side role guard for local-only mode.
export function RoleGate({ allowedRole, children }: { allowedRole: Role; children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const role = storage.getRole();
    if (!role) {
      router.replace('/login');
      return;
    }
    if (role !== allowedRole) {
      router.replace(role === 'owner' ? '/owner/dashboard' : '/worker/dashboard');
      return;
    }
    setReady(true);
  }, [allowedRole, router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-lg font-semibold">Loading...</div>;
  }

  return <>{children}</>;
}
