import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET endpoint to fetch user credits
export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No credits record found, return 0
        return NextResponse.json({ credits: 0 });
      }
      throw error;
    }

    return NextResponse.json({ credits: data.credits || 0 });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Error fetching credits' },
      { status: 500 }
    );
  }
}

// POST endpoint to update user credits
export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { credits } = await req.json();

    if (typeof credits !== 'number' || credits < 0) {
      return NextResponse.json(
        { error: 'Invalid credits value' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('user_credits')
      .upsert({
        user_id: userId,
        credits: credits,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating credits:', error);
      return NextResponse.json(
        { error: 'Error updating credits' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, credits });
  } catch (error) {
    console.error('Unexpected error updating credits:', error);
    return NextResponse.json(
      { error: 'Unexpected error updating credits' },
      { status: 500 }
    );
  }
} 