"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { FormMessage, Message } from "@/components/form-message";
import { useState, useEffect, use } from "react";
import { resendConfirmationEmail } from "@/app/actions";
import { MailIcon, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function EmailConfirmationPage({ 
  searchParams 
}: { 
  searchParams: Promise<Message> 
}) {
  const urlParams = useSearchParams();
  const emailFromUrl = urlParams.get('email');
  const statusParam = urlParams.get('status');
  const errorParam = urlParams.get('error');
  
  const [email, setEmail] = useState(emailFromUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  
  // Determine if this is an existing account that needs confirmation
  const isExistingAccount = errorParam === 'not_confirmed';
  
  // Update email if the URL param changes
  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  // Handle status and error messages from URL parameters
  useEffect(() => {
    if (errorParam === 'not_found') {
      setSubmitError("No account found with this email address. Please sign up first.");
    } else if (errorParam === 'send_failed') {
      setSubmitError("Failed to send confirmation email. Please try again later.");
    } else if (errorParam === 'not_confirmed') {
      // Don't set an error for not_confirmed - we'll handle this with a different UI
      setSubmitError(null);
    } else {
      setSubmitError(null);
    }
    
    if (statusParam === 'resent') {
      setSubmitSuccess("Confirmation email has been resent. Please check your inbox.");
    }
  }, [errorParam, statusParam]);

  async function handleResendEmail(formData: FormData) {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    
    const emailValue = formData.get("email");
    
    // Validate email
    if (!emailValue || typeof emailValue !== "string" || !emailValue.trim()) {
      setSubmitError("Please provide a valid email address");
      setIsSubmitting(false);
      return;
    }
    
    try {
      await resendConfirmationEmail(emailValue.trim());
    } catch (error) {
      console.error("Failed to resend email:", error);
      setSubmitError("Failed to resend email. Please try again later.");
      setIsSubmitting(false);
    }
  }

  // Need to unwrap searchParams with use() before checking its properties
  const resolvedSearchParams = searchParams ? use(searchParams) : null;
  const hasLegacyErrorFormat = resolvedSearchParams && 
    (('error' in resolvedSearchParams) || ('success' in resolvedSearchParams));

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto mt-16 px-8 sm:px-0">
      {isExistingAccount ? (
        // UI for existing account that needs confirmation - simplified to direct to sign in
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-amber-700" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Account Already Exists</h1>
          <p className="text-center text-muted-foreground">
            An account with <span className="font-medium">{email}</span> already exists.
            Please sign in with your password.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      ) : (
        // UI for new accounts that need to confirm their email
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MailIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Check your email</h1>
          <p className="text-center text-muted-foreground">
            {isExistingAccount ?
              "Your account exists but hasn&apos;t been confirmed yet. Enter your email to receive a confirmation link." :
              "We&apos;ve sent a confirmation link to your email. If you can&apos;t find it, you can request another one."}
          </p>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 p-3 bg-green-50 text-green-800 border border-green-200 rounded-md flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{submitSuccess}</p>
        </div>
      )}

      <div id="resend" className="border rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <h2 className="font-medium">
            {isExistingAccount ? 
              "Resend Confirmation Email" : 
              "Didn't receive an email?"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isExistingAccount ? 
              "Send a new confirmation email to activate your account." : 
              "Check your spam folder or request a new confirmation email."}
          </p>
          
          {submitError && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{submitError}</p>
            </div>
          )}
          
          <form action={handleResendEmail} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend confirmation email"
              )}
            </Button>
            
            {/* Only show FormMessage if there's a legacy error format */}
            {hasLegacyErrorFormat && (
              <FormMessage message={searchParams} />
            )}
          </form>
        </div>
      </div>
      
      <Link href="/sign-in" className="block text-center text-sm text-primary hover:underline mt-4">
        Return to sign in
      </Link>
    </div>
  );
} 