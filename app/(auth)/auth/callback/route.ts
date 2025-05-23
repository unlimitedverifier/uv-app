import { createSupabaseClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { ErrorCode } from "@/utils/errors";

export async function GET(request: Request) {
  const client = await createSupabaseClient();
  
  // Get the URL and code from the request
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  
  if (!code) {
    // No code parameter in URL
    return NextResponse.redirect(
      new URL(`/sign-in?code=${ErrorCode.UNKNOWN_ERROR}&message=Invalid+authentication+link`, request.url)
    );
  }
  
  try {
    // Exchange the code for a session
    const result = await client.auth.exchangeCodeForSession(code);
    
    if (result.error) {
      // If there's an error, redirect to sign in with the error
      const errorMessage = result.error.message ? encodeURIComponent(result.error.message) : "Authentication+failed";
      return NextResponse.redirect(
        new URL(`/sign-in?code=${ErrorCode.UNKNOWN_ERROR}&message=${errorMessage}`, request.url)
      );
    }
    
    // Check if this is a password reset flow
    const typeParam = requestUrl.searchParams.get("type");
    const isPasswordReset = typeParam === "recovery";
                           
    if (isPasswordReset) {
      // Password reset flow - redirect to the reset confirm page
      return NextResponse.redirect(
        new URL('/reset-password/confirm', request.url)
      );
    }
    
    // Check if this is likely an email confirmation
    // Supabase doesn't explicitly tell us the type, but we can infer it
    const hasTypeParam = requestUrl.searchParams.has("type");
    const hasNextParam = requestUrl.searchParams.has("next");
    const hasEmailParam = requestUrl.searchParams.has("email");
    const includesConfirmInUrl = requestUrl.toString().toLowerCase().includes("confirm");
    
    const isEmailConfirmation = hasTypeParam || hasNextParam || hasEmailParam || includesConfirmInUrl;
                              
    if (isEmailConfirmation && result.data?.user) {
      // Email confirmation success
      return NextResponse.redirect(
        new URL('/protected?message=Your+email+has+been+confirmed', request.url)
      );
    }
    
    // Default success case
    return NextResponse.redirect(new URL("/protected", request.url));
  } catch (error) {
    // Log the unexpected error for debugging
    console.error("Unexpected error during authentication callback:", error);
    
    // Handle unexpected errors during auth callback
    return NextResponse.redirect(
      new URL(`/sign-in?code=${ErrorCode.UNKNOWN_ERROR}&message=Authentication+process+failed`, request.url)
    );
  }
}
