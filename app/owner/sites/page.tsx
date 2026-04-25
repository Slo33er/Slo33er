'use client';

import { AppShell } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';
import { storage } from '@/lib/storage';
import { Site } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function OwnerSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [newSite, setNewSite] = useState('');

  useEffect(() => setSites(storage.getSites()), []);

  const save = (next: Site[]) => {
    setSites(next);
    storage.setSites(next);
  };

  return (
    <RoleGate allowedRole="owner">
      <AppShell
        title="Manage Sites"
        subtitle="Mock site data"
        links={[
          { href: '/owner/dashboard', label: 'Dashboard' },
          { href: '/owner/container-entries', label: 'Container Entries' },
          { href: '/owner/toolbox-meetings', label: 'Toolbox Meetings' },
          { href: '/owner/sites', label: 'Sites' },
          { href: '/owner/staff', label: 'Staff' },
        ]}
      >
        <div className="card space-y-4 p-5 text-slate-900">
          <div className="flex gap-2">
            <input className="input" placeholder="New site name" value={newSite} onChange={(e) => setNewSite(e.target.value)} />
            <button
              className="btn-primary"
              onClick={() => {
                if (!newSite.trim()) return;
                save([{ id: crypto.randomUUID(), name: newSite.trim(), active: true }, ...sites]);
                setNewSite('');
              }}
            >
              Add
            </button>
          </div>
          {sites.map((site) => (
            <div key={site.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <p>{site.name}</p>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => save(sites.map((s) => (s.id === site.id ? { ...s, active: !s.active } : s)))}>
                  {site.active ? 'Set Inactive' : 'Set Active'}
                </button>
                <button className="btn-secondary" onClick={() => save(sites.filter((s) => s.id !== site.id))}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </AppShell>
    </RoleGate>
  );
}
