import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      console.log('No userId found in auth.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      console.log('No sessionId provided in request.');
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    console.log('Verifying payment for session:', sessionId, 'user:', userId);

    // Check if this session has already been processed
    const { data: processedSession, error: processedError } = await supabaseAdmin
      .from('processed_stripe_events')
      .select('*')
      .eq('event_id', `session_${sessionId}`)
      .single();

    if (processedError && processedError.code !== 'PGRST116') {
      console.error('Error checking processed session:', processedError);
      throw processedError;
    }

    if (processedSession) {
      console.log('Session already processed:', sessionId);
      return NextResponse.json({ success: true });
    }

    // If not processed, verify with Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log('Stripe session retrieved:', session.id, 'status:', session.payment_status, 'metadata:', session.metadata);
    } catch (stripeError) {
      console.error('Error retrieving Stripe session:', stripeError);
      return NextResponse.json({ error: 'Stripe session not found' }, { status: 400 });
    }

    if (session.metadata?.userId !== userId) {
      console.error('Session userId mismatch:', session.metadata?.userId, '!=', userId);
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    if (session.payment_status === 'paid') {
      const credits = parseInt(session.metadata?.credits || '0');
      if (credits <= 0) {
        console.error('Invalid credits amount in session metadata:', session.metadata?.credits);
        return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
      }

      // Get current credits
      const { data: currentCredits, error: creditsError } = await supabaseAdmin
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single();
      if (creditsError && creditsError.code !== 'PGRST116') {
        console.error('Error fetching current credits:', creditsError);
        throw creditsError;
      }
      const newCredits = (currentCredits?.credits || 0) + credits;
      console.log('Adding credits:', credits, 'Current:', currentCredits?.credits || 0, 'New:', newCredits);

      // Add credits to user
      const { error: creditError } = await supabaseAdmin
        .from('user_credits')
        .upsert({
          user_id: userId,
          credits: newCredits,
          updated_at: new Date().toISOString(),
        });
      if (creditError) {
        console.error('Error adding credits:', creditError);
        return NextResponse.json({ error: 'Error adding credits', details: creditError }, { status: 500 });
      }

      // Mark event as processed
      const { error: eventError } = await supabaseAdmin
        .from('processed_stripe_events')
        .insert({
          event_id: `session_${sessionId}`,
          user_id: userId,
          credits: credits,
          processed_at: new Date().toISOString(),
        });
      if (eventError) {
        console.error('Error marking event as processed:', eventError);
        return NextResponse.json({ error: 'Error marking event as processed', details: eventError }, { status: 500 });
      }

      console.log('Successfully processed payment and added credits for user:', userId);
      return NextResponse.json({ success: true });
    } else {
      console.error('Payment not completed. Stripe status:', session.payment_status);
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Error verifying payment' },
      { status: 500 }
    );
  }
} 