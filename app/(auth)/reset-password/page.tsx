"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { createSupabaseClient } from "@/utils/supabase/client"; 
import { useRouter } from "next/navigation";
import { getFullUrl } from "@/utils/config";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const client = createSupabaseClient();
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: getFullUrl('auth/callback?type=recovery'),
      });
      
      if (error) {
        console.error("Password reset error:", error);
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Failed to send reset email:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto mt-16 px-8 sm:px-0">
      {!success ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Reset your password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-800 border border-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-11"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent a password reset link to <span className="font-medium">{email}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Click the link in the email to reset your password. 
            If you don&apos;t see the email, check your spam folder.
          </p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => router.push("/sign-in")}
          >
            Back to sign in
          </Button>
        </div>
      )}
      
      {!success && (
        <Link href="/sign-in" className="block text-center text-sm text-primary hover:underline mt-6">
          Back to sign in
        </Link>
      )}
    </div>
  );
} 