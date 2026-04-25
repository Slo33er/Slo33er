'use client';

import { AppShell } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';
import { storage } from '@/lib/storage';
import { ContainerEntry, ToolboxMeeting } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function WorkerSubmissionsPage() {
  const [containers, setContainers] = useState<ContainerEntry[]>([]);
  const [meetings, setMeetings] = useState<ToolboxMeeting[]>([]);

  useEffect(() => {
    const userName = storage.getUserName();
    setContainers(storage.getContainers().filter((item) => item.submittedBy === userName));
    setMeetings(storage.getToolbox().filter((item) => item.submittedBy === userName));
  }, []);

  return (
    <RoleGate allowedRole="worker">
      <AppShell
        title="My Submissions"
        subtitle="Read-only view"
        links={[
          { href: '/worker/dashboard', label: 'Dashboard' },
          { href: '/worker/new-container', label: 'New Container Job' },
          { href: '/worker/toolbox', label: 'Toolbox Meeting' },
          { href: '/worker/my-submissions', label: 'My Submissions' },
        ]}
      >
        <div className="space-y-6">
          <section className="card p-5 text-slate-900">
            <h2 className="text-xl font-bold">Container Jobs</h2>
            <div className="mt-4 grid gap-3">
              {containers.length === 0 ? <p className="text-slate-600">No submissions yet.</p> : null}
              {containers.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold">{entry.date} — {entry.site}</p>
                  <p className="text-sm text-slate-600">Container {entry.containerNumber} ({entry.containerSize}), cartons: {entry.cartonsUnloaded}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5 text-slate-900">
            <h2 className="text-xl font-bold">Toolbox Meetings</h2>
            <div className="mt-4 grid gap-3">
              {meetings.length === 0 ? <p className="text-slate-600">No meetings yet.</p> : null}
              {meetings.map((meeting) => (
                <div key={meeting.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold">{meeting.date} — {meeting.site}</p>
                  <p className="text-sm text-slate-600">{meeting.topic}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </AppShell>
    </RoleGate>
  );
}
