'use client';

import { AppShell } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';
import { storage } from '@/lib/storage';
import { Staff } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function OwnerStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Worker');

  useEffect(() => setStaff(storage.getStaff()), []);

  const save = (next: Staff[]) => {
    setStaff(next);
    storage.setStaff(next);
  };

  return (
    <RoleGate allowedRole="owner">
      <AppShell
        title="Manage Staff"
        subtitle="Mock staff data"
        links={[
          { href: '/owner/dashboard', label: 'Dashboard' },
          { href: '/owner/container-entries', label: 'Container Entries' },
          { href: '/owner/toolbox-meetings', label: 'Toolbox Meetings' },
          { href: '/owner/sites', label: 'Sites' },
          { href: '/owner/staff', label: 'Staff' },
        ]}
      >
        <div className="card space-y-4 p-5 text-slate-900">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input className="input" placeholder="Staff name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className="input" placeholder="Role" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
            <button
              className="btn-primary"
              onClick={() => {
                if (!newName.trim()) return;
                save([{ id: crypto.randomUUID(), name: newName.trim(), role: newRole || 'Worker', active: true }, ...staff]);
                setNewName('');
                setNewRole('Worker');
              }}
            >
              Add
            </button>
          </div>
          {staff.map((person) => (
            <div key={person.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div>
                <p className="font-semibold">{person.name}</p>
                <p className="text-sm text-slate-600">{person.role}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => save(staff.map((s) => (s.id === person.id ? { ...s, active: !s.active } : s)))}>
                  {person.active ? 'Set Inactive' : 'Set Active'}
                </button>
                <button className="btn-secondary" onClick={() => save(staff.filter((s) => s.id !== person.id))}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </AppShell>
    </RoleGate>
  );
}
