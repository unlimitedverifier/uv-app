import { NextRequest, NextResponse } from 'next/server';
import { createUpdateClient } from '@/utils/update/client';
import { createSupabaseClient } from '@/utils/supabase/server';

// Define subscription type
interface Subscription {
  status: string;
  [key: string]: unknown;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the user's email from Supabase to check subscription
    const supabaseClient = await createSupabaseClient();
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the requested userId matches the authenticated user
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID mismatch' },
        { status: 403 }
      );
    }

    // Check subscription status using Update.dev
    const updateClient = createUpdateClient();
    const { data: subscriptionData, error: subscriptionError } = await updateClient.billing.getSubscriptions();

    if (subscriptionError) {
      console.error('Subscription check error:', subscriptionError);
      return NextResponse.json(
        { 
          hasSubscription: false, 
          error: 'Error checking subscription status' 
        },
        { status: 500 }
      );
    }

    // Check if user has an active subscription
    const hasActiveSubscription = subscriptionData?.subscriptions?.some(
      (sub: Subscription) => sub.status === 'active' || sub.status === 'trialing'
    ) || false;

    return NextResponse.json({
      hasSubscription: hasActiveSubscription,
      userId,
      email: user.email,
      subscriptions: subscriptionData?.subscriptions || []
    });

  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check subscription status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 