'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAuthPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.errorMessage || 'Login failed');
      }
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-xl"
      >
        <h1 className="text-xl font-bold text-white mb-1">Admin Login</h1>
        <p className="text-sm text-slate-400 mb-6">Sign in to view OTP &amp; subscription analytics.</p>

        <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="w-full mb-4 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          placeholder="admin"
        />

        <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full mb-6 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          placeholder="••••••••"
        />

        {error && (
          <p className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-sm text-rose-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full rounded-lg bg-violet-600 py-2.5 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}