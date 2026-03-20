import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'No session ID' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const analysisData = session.metadata?.analysisData;

    if (!analysisData) {
      return NextResponse.json({ error: 'No analysis data' }, { status: 404 });
    }

    const analysis = JSON.parse(analysisData);
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}