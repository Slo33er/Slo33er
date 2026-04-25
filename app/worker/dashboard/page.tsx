'use client';

import { AppShell } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';
import { storage } from '@/lib/storage';
import Link from 'next/link';

export default function WorkerDashboardPage() {
  const name = typeof window !== 'undefined' ? storage.getUserName() : 'Worker';

  return (
    <RoleGate allowedRole="worker">
      <AppShell
        title="Worker Dashboard"
        subtitle={`Welcome ${name}`}
        links={[
          { href: '/worker/dashboard', label: 'Dashboard' },
          { href: '/worker/new-container', label: 'New Container Job' },
          { href: '/worker/toolbox', label: 'Toolbox Meeting' },
          { href: '/worker/my-submissions', label: 'My Submissions' },
        ]}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Link className="card p-6 text-slate-900" href="/worker/new-container">
            <p className="text-2xl font-bold">Submit Container Job</p>
            <p className="mt-2 text-slate-600">Fast form with large mobile-friendly fields.</p>
          </Link>
          <Link className="card p-6 text-slate-900" href="/worker/toolbox">
            <p className="text-2xl font-bold">Submit Toolbox Meeting</p>
            <p className="mt-2 text-slate-600">Record safety topic and attendees.</p>
          </Link>
          <Link className="card p-6 text-slate-900 sm:col-span-2" href="/worker/my-submissions">
            <p className="text-2xl font-bold">View My Submissions</p>
            <p className="mt-2 text-slate-600">Read-only history of your own jobs and meetings.</p>
          </Link>
        </div>
      </AppShell>
    </RoleGate>
  );
}
