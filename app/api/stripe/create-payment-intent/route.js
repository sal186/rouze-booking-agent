import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { amount, currency = 'usd', agentId, sellerId } = await request.json();

    if (!amount || !agentId || !sellerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        agentId,
        sellerId,
      },
      application_fee_amount: Math.round(amount * 100 * 0.10),
      transfer_data: {
        destination: sellerId,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment Intent Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
