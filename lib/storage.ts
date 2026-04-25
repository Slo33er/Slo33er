'use client';

import { ContainerEntry, Role, Site, Staff, ToolboxMeeting } from './types';

const KEYS = {
  role: 'truBlu_role',
  userName: 'truBlu_userName',
  containers: 'truBlu_containers',
  toolbox: 'truBlu_toolbox',
  sites: 'truBlu_sites',
  staff: 'truBlu_staff',
};

const defaultSites: Site[] = [
  { id: crypto.randomUUID(), name: 'Port Botany Yard', active: true },
  { id: crypto.randomUUID(), name: 'Wetherill Park DC', active: true },
];

const defaultStaff: Staff[] = [
  { id: crypto.randomUUID(), name: 'Mason Reed', role: 'Team Leader', active: true },
  { id: crypto.randomUUID(), name: 'Noah Cruz', role: 'Forklift Driver', active: true },
];

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getRole: (): Role | null => (typeof window === 'undefined' ? null : (localStorage.getItem(KEYS.role) as Role | null)),
  setRole: (role: Role) => localStorage.setItem(KEYS.role, role),

  getUserName: () => (typeof window === 'undefined' ? '' : localStorage.getItem(KEYS.userName) || ''),
  setUserName: (name: string) => localStorage.setItem(KEYS.userName, name),

  getContainers: () => readJSON<ContainerEntry[]>(KEYS.containers, []),
  setContainers: (entries: ContainerEntry[]) => writeJSON(KEYS.containers, entries),

  getToolbox: () => readJSON<ToolboxMeeting[]>(KEYS.toolbox, []),
  setToolbox: (meetings: ToolboxMeeting[]) => writeJSON(KEYS.toolbox, meetings),

  getSites: () => {
    const sites = readJSON<Site[]>(KEYS.sites, []);
    if (sites.length) return sites;
    writeJSON(KEYS.sites, defaultSites);
    return defaultSites;
  },
  setSites: (sites: Site[]) => writeJSON(KEYS.sites, sites),

  getStaff: () => {
    const staff = readJSON<Staff[]>(KEYS.staff, []);
    if (staff.length) return staff;
    writeJSON(KEYS.staff, defaultStaff);
    return defaultStaff;
  },
  setStaff: (staff: Staff[]) => writeJSON(KEYS.staff, staff),
};
