"use client";

import { XCircle, AlertTriangle, Info } from "lucide-react";
import { ErrorCode } from "@/utils/errors";
import Link from "next/link";

// Define the types of error display styles
export type ErrorSeverity = "error" | "warning" | "info";

interface ErrorMessageProps {
  code?: string | null;
  message?: string | null;
  severity?: ErrorSeverity;
  className?: string;
  showIcon?: boolean;
  showSignUpLink?: boolean;
}

export default function ErrorMessage({
  code,
  message,
  severity = "error",
  className = "",
  showIcon = true,
  showSignUpLink = false,
}: ErrorMessageProps) {
  // If no error code or message, don't render anything
  if (!code && !message) return null;

  // Determine the background color based on severity
  const bgColor = 
    severity === "error" 
      ? "bg-red-50 text-red-600 border-red-200" 
      : severity === "warning"
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-blue-50 text-blue-600 border-blue-200";

  // Get the icon based on severity
  const Icon = 
    severity === "error" 
      ? XCircle 
      : severity === "warning" 
      ? AlertTriangle 
      : Info;

  // Map error codes to user-friendly messages
  const getErrorMessage = () => {
    if (message) return message;
    
    switch (code) {
      case ErrorCode.INVALID_CREDENTIALS:
        return "Incorrect email or password";
      case ErrorCode.INVALID_EMAIL:
        return "Please enter a valid email address";
      case ErrorCode.INVALID_PASSWORD:
        return "Password must be at least 6 characters";
      case ErrorCode.WEAK_PASSWORD:
        return "Password must be at least 8 characters";
      case ErrorCode.ACCOUNT_EXISTS:
        return "An account with this email already exists";
      case ErrorCode.NO_ACCOUNT:
        return "No account found with this email";
      case ErrorCode.EMAIL_NOT_CONFIRMED:
        return "Please confirm your email before signing in";
      case ErrorCode.PASSWORDS_DONT_MATCH:
        return "Passwords do not match";
      case ErrorCode.RATE_LIMITED:
        return "Too many attempts. Please try again later";
      case ErrorCode.NETWORK_ERROR:
        return "Network error. Please check your connection";
      default:
        return "An error occurred";
    }
  };

  const errorMessage = getErrorMessage();
  const showSignUp = code === ErrorCode.NO_ACCOUNT && showSignUpLink;

  return (
    <div className={`p-4 rounded-lg flex items-center gap-3 border ${bgColor} ${className}`}>
      {showIcon && <Icon className="h-5 w-5 flex-shrink-0" />}
      <p className="text-sm">
        {errorMessage}
        {showSignUp && (
          <Link href="/sign-in?mode=signup" className="ml-1 text-primary hover:underline">
            Sign up instead?
          </Link>
        )}
      </p>
    </div>
  );
} 