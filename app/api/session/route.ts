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
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    return NextResponse.json({ 
      paid: true,
      plan: session.metadata?.plan ?? 'basic',
    });
  } catch (err) {
    console.error('Session API error:', err);
    return NextResponse.json({ error: 'Failed to retrieve session', detail: String(err) }, { status: 500 });
  }
}