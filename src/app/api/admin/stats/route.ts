import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/lib/analyticsStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const fromTs = fromParam ? new Date(fromParam).getTime() : undefined;
  const toTs = toParam ? new Date(toParam).getTime() + 86_399_999 : undefined; // end of day

  const stats =  await getStats(fromTs, toTs);
  return NextResponse.json(stats);
}