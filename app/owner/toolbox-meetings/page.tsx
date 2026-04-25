'use client';

import { AppShell } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';
import { storage } from '@/lib/storage';
import { ToolboxMeeting } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function OwnerToolboxMeetingsPage() {
  const [meetings, setMeetings] = useState<ToolboxMeeting[]>([]);

  useEffect(() => {
    setMeetings(storage.getToolbox());
  }, []);

  return (
    <RoleGate allowedRole="owner">
      <AppShell
        title="Toolbox Meetings"
        subtitle="All submissions"
        links={[
          { href: '/owner/dashboard', label: 'Dashboard' },
          { href: '/owner/container-entries', label: 'Container Entries' },
          { href: '/owner/toolbox-meetings', label: 'Toolbox Meetings' },
          { href: '/owner/sites', label: 'Sites' },
          { href: '/owner/staff', label: 'Staff' },
        ]}
      >
        <div className="card space-y-4 p-5 text-slate-900">
          {meetings.length === 0 ? <p className="text-slate-600">No toolbox meetings yet.</p> : null}
          {meetings.map((meeting) => (
            <div key={meeting.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold">{meeting.date} — {meeting.site}</p>
              <p className="text-sm text-slate-600">Topic: {meeting.topic}</p>
              <p className="text-sm text-slate-600">Submitted by: {meeting.submittedBy}</p>
            </div>
          ))}
        </div>
      </AppShell>
    </RoleGate>
  );
}
