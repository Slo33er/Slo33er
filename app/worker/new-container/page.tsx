'use client';

import { AppShell } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';
import { storage } from '@/lib/storage';
import { ContainerEntry } from '@/lib/types';
import { useState } from 'react';

const initialState = {
  date: '',
  site: '',
  containerNumber: '',
  containerSize: '20ft' as '20ft' | '40ft',
  teamLeader: '',
  forkliftDriver: '',
  wrappers: '',
  lifters: '',
  startTime: '',
  finishTime: '',
  cartonsUnloaded: 0,
  hasIssue: 'no' as 'yes' | 'no',
  issueNotes: '',
  photoPlaceholder: '',
};

export default function NewContainerPage() {
  const [form, setForm] = useState(initialState);
  const [saved, setSaved] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submittedBy = storage.getUserName() || 'Worker User';
    const current = storage.getContainers();

    const newEntry: ContainerEntry = {
      id: crypto.randomUUID(),
      ...form,
      submittedBy,
      createdAt: new Date().toISOString(),
    };

    storage.setContainers([newEntry, ...current]);
    setSaved(true);
    setForm(initialState);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <RoleGate allowedRole="worker">
      <AppShell
        title="New Container Job"
        subtitle="Worker form"
        links={[
          { href: '/worker/dashboard', label: 'Dashboard' },
          { href: '/worker/new-container', label: 'New Container Job' },
          { href: '/worker/toolbox', label: 'Toolbox Meeting' },
          { href: '/worker/my-submissions', label: 'My Submissions' },
        ]}
      >
        <form onSubmit={onSubmit} className="card space-y-4 p-5 text-slate-900 sm:p-7">
          {saved ? <p className="rounded-xl bg-emerald-100 p-3 font-semibold text-emerald-700">Container job submitted.</p> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Date', 'date'], ['Site', 'site'], ['Container Number', 'containerNumber'],
              ['Team Leader', 'teamLeader'], ['Forklift Driver', 'forkliftDriver'], ['Wrappers', 'wrappers'],
              ['Lifters', 'lifters'], ['Start Time', 'startTime'], ['Finish Time', 'finishTime'],
              ['Photo Placeholder', 'photoPlaceholder'],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  required={['date', 'site', 'containerNumber'].includes(key)}
                  type={key === 'date' ? 'date' : key.includes('Time') ? 'time' : 'text'}
                  className="input"
                  value={(form as Record<string, string | number>)[key] as string}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}

            <div>
              <label className="label">Container Size</label>
              <select className="input" value={form.containerSize} onChange={(e) => setForm((prev) => ({ ...prev, containerSize: e.target.value as '20ft' | '40ft' }))}>
                <option value="20ft">20ft</option>
                <option value="40ft">40ft</option>
              </select>
            </div>

            <div>
              <label className="label">Cartons Unloaded</label>
              <input type="number" className="input" value={form.cartonsUnloaded} onChange={(e) => setForm((prev) => ({ ...prev, cartonsUnloaded: Number(e.target.value) }))} />
            </div>

            <div>
              <label className="label">Issue?</label>
              <select className="input" value={form.hasIssue} onChange={(e) => setForm((prev) => ({ ...prev, hasIssue: e.target.value as 'yes' | 'no' }))}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="label">Issue Notes</label>
              <textarea className="input min-h-24" value={form.issueNotes} onChange={(e) => setForm((prev) => ({ ...prev, issueNotes: e.target.value }))} />
            </div>
          </div>

          <button className="btn-primary w-full sm:w-auto" type="submit">Submit Container Job</button>
        </form>
      </AppShell>
    </RoleGate>
  );
}
