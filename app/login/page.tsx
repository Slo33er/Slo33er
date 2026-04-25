'use client';

import { storage } from '@/lib/storage';
import { Role } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');

  const handleLogin = (role: Role) => {
    storage.setRole(role);
    storage.setUserName(name || (role === 'owner' ? 'Owner User' : 'Worker User'));
    router.push(role === 'owner' ? '/owner/dashboard' : '/worker/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand.dark via-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/95 p-6 shadow-2xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand.blue">Tru Blu Container Crew</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Tru Blu V2 Portal</h1>
        <p className="mt-2 text-sm text-slate-600">Local-only demo login. Pick your role to enter.</p>

        <div className="mt-6">
          <label className="label">Your name</label>
          <input className="input" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="mt-6 grid gap-3">
          <button onClick={() => handleLogin('worker')} className="btn-primary w-full text-lg">
            Worker Login
          </button>
          <button onClick={() => handleLogin('owner')} className="btn-secondary w-full text-lg">
            Owner Login
          </button>
        </div>
      </div>
    </div>
  );
}
