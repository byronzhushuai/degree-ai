import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const { plan, analysisData } = await request.json();

  const priceMap: Record<string, number> = {
    basic: 1900,
    advisor: 9900,
  };

  const nameMap: Record<string, string> = {
    basic: 'Degree AI — Full Report',
    advisor: 'Degree AI — Advisor Plan',
  };

  const amount = priceMap[plan];
  if (!amount) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: nameMap[plan] },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${request.headers.get('origin')}/`,
    metadata: {
      analysisData: JSON.stringify(analysisData).slice(0, 500),
    },
  });

  return NextResponse.json({ url: session.url });
}