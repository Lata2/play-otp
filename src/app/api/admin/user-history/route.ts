import { NextRequest, NextResponse } from 'next/server';
import { getUserActivity } from '@/lib/analyticsStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const msisdn = searchParams.get('msisdn');

  if (!msisdn) {
    return NextResponse.json({ errorMessage: 'msisdn is required' }, { status: 400 });
  }

  const events = await getUserActivity(msisdn);
  return NextResponse.json({ msisdn, events });
}