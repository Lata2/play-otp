'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AnalyticsSummary, UserStat } from '@/lib/analyticsStore';

type CardTone = 'violet' | 'fuchsia' | 'sky' | 'emerald' | 'rose' | 'amber';

const TONE_STYLES: Record<CardTone, { icon: string; ring: string }> = {
  violet: { icon: 'bg-violet-100 text-violet-600', ring: 'from-violet-400' },
  fuchsia: {
    icon: 'bg-fuchsia-100 text-fuchsia-600',
    ring: 'from-fuchsia-400',
  },
  sky: { icon: 'bg-sky-100 text-sky-600', ring: 'from-sky-400' },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600',
    ring: 'from-emerald-400',
  },
  rose: { icon: 'bg-rose-100 text-rose-600', ring: 'from-rose-400' },
  amber: { icon: 'bg-amber-100 text-amber-600', ring: 'from-amber-400' },
};

const PAGE_SIZE = 20;
const ACTIVITY_PAGE_SIZE = 20;

const REASON_LABELS: Record<string, string> = {
  NOT_FOUND: 'No PIN request found',
  EXPIRED: 'PIN expired',
  TOO_MANY_ATTEMPTS: 'Too many wrong attempts',
  INVALID_PIN: 'Wrong PIN entered',
  MANY_TIME_WRONG_OTP: 'Many time wrong OTP',
};

type ActivityEvent = {
  type: 'otp_request' | 'verification' | 'subscription';
  success?: boolean;
  isResend?: boolean;
  failReason?: string | null;
  createdAt: number;
};

// Thrown by fetchStats so the component can tell "session expired" apart
// from a normal network/server error.
class UnauthorizedError extends Error {}

async function fetchStats(fromDate: string, toDate: string): Promise<AnalyticsSummary> {
  const params = new URLSearchParams();
  if (fromDate) params.set('from', fromDate);
  if (toDate) params.set('to', toDate);
  const qs = params.toString();

  const res = await fetch(`/api/admin/stats${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });

  if (res.status === 401) {
    throw new UnauthorizedError('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.errorMessage || 'Failed to load stats');
  return data;
}

async function fetchUserActivity(msisdn: string): Promise<ActivityEvent[]> {
  const res = await fetch(`/api/admin/user-history?msisdn=${encodeURIComponent(msisdn)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.errorMessage || 'Failed to load history');
  return data.events ?? [];
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: CardTone;
  icon: React.ReactNode;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.ring} to-transparent`}
      />
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserRow({
  user,
  isExpanded,
  onToggle,
}: {
  user: UserStat;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // TanStack Query khud hi cache karta hai per-msisdn — row band/khol karne
  // par dobara fetch nahi hota jab tak data stale na ho.
  const activityQuery = useQuery({
    queryKey: ['user-history', user.msisdn],
    queryFn: () => fetchUserActivity(user.msisdn),
    enabled: isExpanded,
    staleTime: 60_000,
  });

  const activity = activityQuery.data;
  const loadingActivity = isExpanded && activityQuery.isLoading;

  // Expanded history table ka apna infinite-scroll pagination — 20 rows
  // ek baar me, scroll karne par agli 20 load hongi.
  const [activityVisibleCount, setActivityVisibleCount] = useState(ACTIVITY_PAGE_SIZE);
  const activitySentinelRef = useRef<HTMLTableRowElement | null>(null);

  // Row band (collapse) hote hi, render ke dauran hi pagination reset kar do
  // (useEffect ke andar setState karne se cascading-render warning aati hai,
  // isliye yahan "state during render" pattern use kiya hai).
  const [prevIsExpanded, setPrevIsExpanded] = useState(isExpanded);
  if (prevIsExpanded !== isExpanded) {
    setPrevIsExpanded(isExpanded);
    if (!isExpanded) {
      setActivityVisibleCount(ACTIVITY_PAGE_SIZE);
    }
  }

  const visibleActivity = activity ? activity.slice(0, activityVisibleCount) : [];
  const activityHasMore = !!activity && activityVisibleCount < activity.length;

  useEffect(() => {
    if (!isExpanded || !activityHasMore) return;
    const node = activitySentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setActivityVisibleCount((c) =>
            Math.min(c + ACTIVITY_PAGE_SIZE, activity?.length ?? c)
          );
        }
      },
      { rootMargin: '150px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isExpanded, activityHasMore, activity]);

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-t border-slate-100 transition hover:bg-violet-50/40"
      >
        <td className="whitespace-nowrap px-5 py-3.5 font-mono text-sm text-slate-800">
          <span className="mr-2 inline-block w-3 text-slate-400">
            {isExpanded ? '▾' : '▸'}
          </span>
          +{user.msisdn}
        </td>
        <td className="px-5 py-3.5 text-sm text-slate-600">{user.otpRequests}</td>
        <td className="px-5 py-3.5 text-sm">
          {user.pinFailed > 0 ? (
            <div className="flex flex-col gap-0.5">
              <span className="w-fit rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {user.pinFailed}
              </span>
              {user.lastVerifyFailReason && (
                <span className="text-[11px] text-amber-600">
                  {REASON_LABELS[user.lastVerifyFailReason] ?? user.lastVerifyFailReason}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">0</span>
          )}
        </td>
        <td className="px-5 py-3.5 text-sm">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {user.verifySuccess}
          </span>
        </td>
        <td className="px-5 py-3.5 text-sm">
          {user.subscriptionFailed > 0 ? (
            <div className="flex flex-col gap-0.5">
              <span className="w-fit rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                {user.subscriptionFailed}
              </span>
              {user.lastSubscriptionFailReason && (
                <span className="text-[11px] text-rose-500">
                  {REASON_LABELS[user.lastSubscriptionFailReason] ?? user.lastSubscriptionFailReason}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">0</span>
          )}
        </td>
        <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">
          {user.lastOtpAt ? new Date(user.lastOtpAt).toLocaleString() : '-'}
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-t border-slate-100 bg-slate-50/70">
          <td colSpan={6} className="px-5 py-4">
            {loadingActivity && (
              <p className="text-xs text-slate-400">Loading history...</p>
            )}
            {activityQuery.isError && (
              <p className="text-xs text-rose-500">
                {activityQuery.error instanceof Error
                  ? activityQuery.error.message
                  : 'Failed to load history'}
              </p>
            )}
            {!loadingActivity && activity && activity.length === 0 && (
              <p className="text-xs text-slate-400">No history found.</p>
            )}
            {!loadingActivity && activity && activity.length > 0 && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="py-1 pr-4 font-medium">Date &amp; Time</th>
                    <th className="py-1 pr-4 font-medium">Event</th>
                    <th className="py-1 pr-4 font-medium">Status</th>
                    <th className="py-1 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleActivity.map((ev, i) => (
                    <tr key={i} className="border-t border-slate-200/70">
                      <td className="py-1.5 pr-4 text-slate-600">
                        {new Date(ev.createdAt).toLocaleString()}
                      </td>
                      <td className="py-1.5 pr-4 text-slate-600">
                        {ev.type === 'otp_request' && (ev.isResend ? 'PIN resend' : 'PIN request')}
                        {ev.type === 'verification' && 'PIN try'}
                        {ev.type === 'subscription' && 'Subscription'}
                      </td>
                      <td className="py-1.5 pr-4">
                        {ev.type === 'otp_request' ? (
                          <span className="text-slate-500">sent</span>
                        ) : ev.success ? (
                          <span className="text-emerald-600">success</span>
                        ) : (
                          <span className="text-rose-600">failed</span>
                        )}
                      </td>
                      <td className="py-1.5 text-slate-500">
                        {ev.failReason ? REASON_LABELS[ev.failReason] ?? ev.failReason : '-'}
                      </td>
                    </tr>
                  ))}
                  {activityHasMore && (
                    <tr ref={activitySentinelRef}>
                      <td colSpan={4} className="py-2 text-center text-[11px] text-slate-400">
                        <span className="mr-2 inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500 align-middle" />
                        Loading more...
                      </td>
                    </tr>
                  )}
                  {!activityHasMore && activity && activity.length > ACTIVITY_PAGE_SIZE && (
                    <tr>
                      <td colSpan={4} className="py-2 text-center text-[11px] text-slate-400">
                        All {activity.length} entries loaded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Date range filter state (yyyy-mm-dd strings, matches <input type="date">)
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Infinite scroll: how many rows are currently rendered
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Per-user expandable detail view — sirf ek user ka msisdn track karte hain,
  // history khud UserRow ke andar useQuery se aati/cache hoti hai.
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  function toggleUser(msisdn: string) {
    setExpandedUser((prev) => (prev === msisdn ? null : msisdn));
  }

  const statsQuery = useQuery({
    queryKey: ['admin-stats', fromDate, toDate],
    queryFn: () => fetchStats(fromDate, toDate),
    refetchInterval: 10000,
  });

  const stats = statsQuery.data ?? null;
  const isUnauthorized = statsQuery.error instanceof UnauthorizedError;
  const error =
    statsQuery.error && !isUnauthorized
      ? statsQuery.error instanceof Error
        ? statsQuery.error.message
        : 'Failed to load stats'
      : null;
  const lastUpdated = statsQuery.dataUpdatedAt ? new Date(statsQuery.dataUpdatedAt) : null;

  useEffect(() => {
    if (isUnauthorized) {
      router.push('/admin/auth');
    }
  }, [isUnauthorized, router]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/admin/logout', { method: 'POST' });
    },
    onSuccess: () => {
      router.push('/admin/auth');
    },
  });

  const filteredUsers = useMemo(() => {
    if (!stats) return [];
    const q = search.trim();
    if (!q) return stats.users;
    return stats.users.filter((u) => u.msisdn.includes(q));
  }, [stats, search]);

  // Reset how many rows are shown whenever the filters or data change.
  // (Adjusting state during render, per React's documented pattern —
  // uses state, not refs, since refs can't be read/written during render.)
  const [prevResetKey, setPrevResetKey] = useState({
    search,
    fromDate,
    toDate,
    stats,
  });
  if (
    prevResetKey.search !== search ||
    prevResetKey.fromDate !== fromDate ||
    prevResetKey.toDate !== toDate ||
    prevResetKey.stats !== stats
  ) {
    setPrevResetKey({ search, fromDate, toDate, stats });
    setVisibleCount(PAGE_SIZE);
  }
  const visibleUsers = filteredUsers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredUsers.length;

  // Observe the sentinel row; when it scrolls into view, load the next page.
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredUsers.length));
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, filteredUsers.length]);

  function clearDateFilter() {
    setFromDate('');
    setToDate('');
  }

  if (error && !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F5F0FF] via-[#EFF6FF] to-[#ECFEFF]">
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-rose-600">
          {error}
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F5F0FF] via-[#EFF6FF] to-[#ECFEFF]">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F0FF] via-[#EFF6FF] to-[#ECFEFF]">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
              <Icon path="M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v4l3 3" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-slate-900">
                PlayChat Admin
              </h1>
              <p className="text-xs text-slate-500">
                PIN &amp; subscription monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="hidden text-xs text-slate-400 sm:inline">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Stat cards */}
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="PIN Requests"
            value={stats.totalOtpRequests}
            tone="violet"
            icon={
              <Icon path="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
            }
          />
          <StatCard
            label="Failed PIN"
            value={stats.totalPinFailed}
            tone="amber"
            icon={<Icon path="M18 6L6 18M6 6l12 12" />}
          />
          <StatCard
            label="Successful"
            value={stats.totalSuccess}
            tone="emerald"
            icon={<Icon path="M20 6L9 17l-5-5" />}
          />
          <StatCard
            label="Subscription Failed"
            value={stats.totalSubscriptionFailed}
            tone="rose"
            icon={<Icon path="M18 6L6 18M6 6l12 12" />}
          />
          <StatCard
            label="Unique Users"
            value={stats.uniqueUsers}
            tone="fuchsia"
            icon={
              <Icon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            }
          />
        </div>

        {/* Table section */}
        <div className="mb-4">
          <h2 className="mb-3 text-base font-semibold text-slate-800">
            Per-user activity
          </h2>

          <div className="flex flex-wrap items-end justify-between gap-3">
            {/* Date range filter */}
            <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-violet-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">To</label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-violet-400 focus:outline-none"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  onClick={clearDateFilter}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                >
                  Clear filter
                </button>
              )}
              {/* Search */}
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon path="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by number..."
                  className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-violet-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">MSISDN</th>
                <th className="px-5 py-3 font-medium">PIN Requests</th>
                <th className="px-5 py-3 font-medium">Failed PIN</th>
                <th className="px-5 py-3 font-medium">Success</th>
                <th className="px-5 py-3 font-medium">Subscription Failed</th>
                <th className="px-5 py-3 font-medium">Last PIN</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-slate-400"
                  >
                    {stats.users.length === 0
                      ? 'No activity yet.'
                      : 'No users match your search.'}
                  </td>
                </tr>
              )}
              {visibleUsers.map((u) => (
                <UserRow
                  key={u.msisdn}
                  user={u}
                  isExpanded={expandedUser === u.msisdn}
                  onToggle={() => toggleUser(u.msisdn)}
                />
              ))}
            </tbody>
          </table>

          {/* Sentinel: when this scrolls into view, load the next chunk */}
          {hasMore && (
            <div
              ref={sentinelRef}
              className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400"
            >
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500" />
              Loading more...
            </div>
          )}

          {!hasMore && filteredUsers.length > PAGE_SIZE && (
            <div className="py-4 text-center text-xs text-slate-400">
              All {filteredUsers.length} users loaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}