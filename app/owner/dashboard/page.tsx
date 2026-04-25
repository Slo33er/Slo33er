'use client';

import { AppShell } from '@/components/AppShell';
import { RoleGate } from '@/components/RoleGate';
import { SummaryCard } from '@/components/SummaryCard';
import { storage } from '@/lib/storage';
import { useEffect, useState } from 'react';

export default function OwnerDashboardPage() {
  const [totalJobs, setTotalJobs] = useState(0);
  const [jobsWithIssues, setJobsWithIssues] = useState(0);
  const [toolboxTotal, setToolboxTotal] = useState(0);
  const [activeStaff, setActiveStaff] = useState(0);

  useEffect(() => {
    const containers = storage.getContainers();
    const toolbox = storage.getToolbox();
    const staff = storage.getStaff();

    setTotalJobs(containers.length);
    setJobsWithIssues(containers.filter((job) => job.hasIssue === 'yes').length);
    setToolboxTotal(toolbox.length);
    setActiveStaff(staff.filter((person) => person.active).length);
  }, []);

  return (
    <RoleGate allowedRole="owner">
      <AppShell
        title="Owner Dashboard"
        subtitle="Admin panel"
        links={[
          { href: '/owner/dashboard', label: 'Dashboard' },
          { href: '/owner/container-entries', label: 'Container Entries' },
          { href: '/owner/toolbox-meetings', label: 'Toolbox Meetings' },
          { href: '/owner/sites', label: 'Sites' },
          { href: '/owner/staff', label: 'Staff' },
        ]}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total jobs" value={totalJobs} />
          <SummaryCard label="Jobs with issues" value={jobsWithIssues} />
          <SummaryCard label="Toolbox meetings" value={toolboxTotal} />
          <SummaryCard label="Active staff" value={activeStaff} />
        </div>
      </AppShell>
    </RoleGate>
  );
}
