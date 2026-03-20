import { NextRequest, NextResponse } from 'next/server';
import { sendReportEmail } from '@/lib/sendReportEmail';

export async function POST(request: NextRequest) {
  const { toEmail, reportId, userName } = await request.json();

  if (!toEmail || !reportId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await sendReportEmail({ toEmail, reportId, userName });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Email send failed:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
