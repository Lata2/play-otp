import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isValidSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';
import { AdminDashboard } from '@/components/AdminDashboard';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSession(token)) {
    redirect('/admin/auth');
  }

  return <AdminDashboard />;
}