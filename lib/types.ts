export type Role = 'worker' | 'owner';

export type ContainerEntry = {
  id: string;
  date: string;
  site: string;
  containerNumber: string;
  containerSize: '20ft' | '40ft';
  teamLeader: string;
  forkliftDriver: string;
  wrappers: string;
  lifters: string;
  startTime: string;
  finishTime: string;
  cartonsUnloaded: number;
  hasIssue: 'yes' | 'no';
  issueNotes: string;
  photoPlaceholder: string;
  submittedBy: string;
  createdAt: string;
};

export type ToolboxMeeting = {
  id: string;
  date: string;
  site: string;
  topic: string;
  notes: string;
  attendees: string;
  submittedBy: string;
  createdAt: string;
};

export type Site = { id: string; name: string; active: boolean };
export type Staff = { id: string; name: string; role: string; active: boolean };
