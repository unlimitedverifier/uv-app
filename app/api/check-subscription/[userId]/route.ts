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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Try to get authenticated user
    const supabaseClient = await createSupabaseClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    // If we have an authenticated user, verify it matches the requested userId
    if (user && user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID mismatch' },
        { status: 403 }
      );
    }

    // If no authenticated user, we'll proceed with API-to-API call
    // This allows the Flask API to check subscription status
    if (!user) {
      console.log(`API-to-API subscription check for user: ${userId}`);
    }

    // For now, let's check if this user exists in our system
    // You might want to add a database check here to verify the user exists
    
    // Check subscription status using Update.dev
    // Note: This might need to be adjusted based on how Update.dev identifies users
    try {
      const updateClient = createUpdateClient();
      const { data: subscriptionData, error: subscriptionError } = await updateClient.billing.getSubscriptions();

      if (subscriptionError) {
        console.error('Subscription check error:', subscriptionError);
        
        // For API calls, we'll return a "no subscription" response rather than an error
        // This allows the Flask API to handle the case gracefully
        return NextResponse.json({
          hasSubscription: false,
          userId,
          email: user?.email || null,
          reason: 'Error checking subscription status',
          subscriptions: []
        });
      }

      // Check if user has an active subscription
      const hasActiveSubscription = subscriptionData?.subscriptions?.some(
        (sub: Subscription) => sub.status === 'active' || sub.status === 'trialing'
      ) || false;

      return NextResponse.json({
        hasSubscription: hasActiveSubscription,
        userId,
        email: user?.email || null,
        subscriptions: subscriptionData?.subscriptions || []
      });

    } catch (updateError) {
      console.error('Update.dev error:', updateError);
      
      // TEMPORARY: Return true for testing purposes
      // TODO: Fix Update.dev integration and change back to false
      return NextResponse.json({
        hasSubscription: true, // TEMPORARY: Set to true for testing
        userId,
        email: user?.email || null,
        reason: 'Update.dev integration error - returning true for testing',
        subscriptions: []
      });
    }

  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { 
        hasSubscription: false,
        error: 'Failed to check subscription status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 