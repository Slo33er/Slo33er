'use client';

import { AppShell } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';
import { storage } from '@/lib/storage';
import { ContainerEntry } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function OwnerContainerEntriesPage() {
  const [entries, setEntries] = useState<ContainerEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => setEntries(storage.getContainers()), []);

  const saveEntries = (next: ContainerEntry[]) => {
    setEntries(next);
    storage.setContainers(next);
  };

  const handleDelete = (id: string) => {
    saveEntries(entries.filter((entry) => entry.id !== id));
  };

  const handleFieldChange = (id: string, field: keyof ContainerEntry, value: string) => {
    const next = entries.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry));
    setEntries(next);
  };

  return (
    <RoleGate allowedRole="owner">
      <AppShell
        title="Container Entries"
        subtitle="Owner can edit and delete"
        links={[
          { href: '/owner/dashboard', label: 'Dashboard' },
          { href: '/owner/container-entries', label: 'Container Entries' },
          { href: '/owner/toolbox-meetings', label: 'Toolbox Meetings' },
          { href: '/owner/sites', label: 'Sites' },
          { href: '/owner/staff', label: 'Staff' },
        ]}
      >
        <div className="card space-y-4 p-5 text-slate-900">
          {entries.length === 0 ? <p className="text-slate-600">No container entries yet.</p> : null}
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-slate-200 p-4">
              {editingId === entry.id ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="input" value={entry.site} onChange={(e) => handleFieldChange(entry.id, 'site', e.target.value)} />
                  <input className="input" value={entry.containerNumber} onChange={(e) => handleFieldChange(entry.id, 'containerNumber', e.target.value)} />
                  <input className="input" value={entry.teamLeader} onChange={(e) => handleFieldChange(entry.id, 'teamLeader', e.target.value)} />
                  <input className="input" value={entry.issueNotes} onChange={(e) => handleFieldChange(entry.id, 'issueNotes', e.target.value)} />
                </div>
              ) : (
                <>
                  <p className="font-semibold">{entry.date} — {entry.site}</p>
                  <p className="text-sm text-slate-600">Container {entry.containerNumber}, by {entry.submittedBy}, issue: {entry.hasIssue}</p>
                </>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {editingId === entry.id ? (
                  <button className="btn-primary" onClick={() => { saveEntries(entries); setEditingId(null); }}>
                    Save
                  </button>
                ) : (
                  <button className="btn-secondary" onClick={() => setEditingId(entry.id)}>
                    Edit
                  </button>
                )}
                <button className="btn-secondary" onClick={() => handleDelete(entry.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </AppShell>
    </RoleGate>
  );
}
