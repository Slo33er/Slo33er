'use client';

import { AppShell } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';
import { storage } from '@/lib/storage';
import { ToolboxMeeting } from '@/lib/types';
import { useState } from 'react';

const initialState = { date: '', site: '', topic: '', notes: '', attendees: '' };

export default function WorkerToolboxPage() {
  const [form, setForm] = useState(initialState);
  const [saved, setSaved] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submittedBy = storage.getUserName() || 'Worker User';
    const current = storage.getToolbox();
    const newMeeting: ToolboxMeeting = {
      id: crypto.randomUUID(),
      ...form,
      submittedBy,
      createdAt: new Date().toISOString(),
    };
    storage.setToolbox([newMeeting, ...current]);
    setForm(initialState);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <RoleGate allowedRole="worker">
      <AppShell
        title="Toolbox Meeting"
        subtitle="Worker form"
        links={[
          { href: '/worker/dashboard', label: 'Dashboard' },
          { href: '/worker/new-container', label: 'New Container Job' },
          { href: '/worker/toolbox', label: 'Toolbox Meeting' },
          { href: '/worker/my-submissions', label: 'My Submissions' },
        ]}
      >
        <form onSubmit={onSubmit} className="card space-y-4 p-5 text-slate-900 sm:p-7">
          {saved ? <p className="rounded-xl bg-emerald-100 p-3 font-semibold text-emerald-700">Toolbox meeting submitted.</p> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Date</label>
              <input required type="date" className="input" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Site</label>
              <input required className="input" value={form.site} onChange={(e) => setForm((prev) => ({ ...prev, site: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Topic</label>
              <input required className="input" value={form.topic} onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea className="input min-h-24" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Attendees</label>
              <input className="input" placeholder="Names separated by commas" value={form.attendees} onChange={(e) => setForm((prev) => ({ ...prev, attendees: e.target.value }))} />
            </div>
          </div>
          <button className="btn-primary w-full sm:w-auto" type="submit">Submit Toolbox Meeting</button>
        </form>
      </AppShell>
    </RoleGate>
  );
}
