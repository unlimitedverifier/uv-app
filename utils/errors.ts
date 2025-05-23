import { encodedRedirect } from "@/utils/redirect";

// Standard error codes
export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = "invalid_credentials",
  INVALID_EMAIL = "invalid_email",
  INVALID_PASSWORD = "invalid_password",
  EMAIL_NOT_CONFIRMED = "email_not_confirmed",
  ACCOUNT_EXISTS = "already_exists",
  NO_ACCOUNT = "no_account",
  
  // Password errors
  WEAK_PASSWORD = "weak_password",
  PASSWORDS_DONT_MATCH = "passwords_dont_match",
  
  // Email confirmation
  EMAIL_CONFIRMATION_PENDING = "pending",
  EMAIL_CONFIRMATION_RESENT = "resent",
  EMAIL_CONFIRMATION_FAILED = "send_failed",
  EMAIL_ALREADY_CONFIRMED = "already_confirmed",
  EMAIL_NOT_FOUND = "not_found",
  
  // Social auth
  GOOGLE_ERROR = "google_error",
  
  // General errors
  UNKNOWN_ERROR = "unknown",
  RATE_LIMITED = "rate_limited",
  NETWORK_ERROR = "network_error"
}

// Standard error messages (for server logs)
export const ErrorMessages = {
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid email or password",
  [ErrorCode.INVALID_EMAIL]: "Invalid email format",
  [ErrorCode.INVALID_PASSWORD]: "Password too short (min 6 characters)",
  [ErrorCode.EMAIL_NOT_CONFIRMED]: "Email not confirmed",
  [ErrorCode.ACCOUNT_EXISTS]: "Account already exists",
  [ErrorCode.NO_ACCOUNT]: "Account does not exist",
  [ErrorCode.WEAK_PASSWORD]: "Password too weak (min 8 characters)",
  [ErrorCode.PASSWORDS_DONT_MATCH]: "Passwords do not match",
  [ErrorCode.EMAIL_CONFIRMATION_PENDING]: "Email confirmation required",
  [ErrorCode.EMAIL_CONFIRMATION_RESENT]: "Confirmation email resent",
  [ErrorCode.EMAIL_CONFIRMATION_FAILED]: "Failed to send confirmation email",
  [ErrorCode.EMAIL_ALREADY_CONFIRMED]: "Email already confirmed",
  [ErrorCode.EMAIL_NOT_FOUND]: "Email not found",
  [ErrorCode.GOOGLE_ERROR]: "Google authentication error",
  [ErrorCode.UNKNOWN_ERROR]: "An unexpected error occurred",
  [ErrorCode.RATE_LIMITED]: "Too many requests, please try again later",
  [ErrorCode.NETWORK_ERROR]: "Network error, please check your connection"
};

// A type-safe logger for errors that can be expanded later
export const logError = (code: ErrorCode, details?: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${ErrorMessages[code]}`, details || "");
  }
  // In production, this could send to monitoring service
};

// Standard error handling for auth redirects
export const handleAuthError = (errorCode: ErrorCode, redirectPath: string = "/sign-in", additionalParams?: Record<string, string>) => {
  logError(errorCode);
  return encodedRedirect(redirectPath, errorCode, undefined, additionalParams);
};

// Helper to extract error from Supabase auth errors
export interface SupabaseError {
  message: string;
  status?: number;
  code?: string;
}

export const getErrorCodeFromSupabase = (error: SupabaseError | Error | unknown): ErrorCode => {
  if (!error || (typeof error !== 'object') || !('message' in error)) return ErrorCode.UNKNOWN_ERROR;

  const message = (error.message as string).toLowerCase();
  
  if (message.includes('email not confirmed')) {
    return ErrorCode.EMAIL_NOT_CONFIRMED;
  }
  
  if (message.includes('invalid login credentials')) {
    return ErrorCode.INVALID_CREDENTIALS;
  }
  
  if (message.includes('email already')) {
    return ErrorCode.ACCOUNT_EXISTS;
  }
  
  if (message.includes('already confirmed')) {
    return ErrorCode.EMAIL_ALREADY_CONFIRMED;
  }
  
  if (message.includes('email not found') || message.includes('user not found')) {
    return ErrorCode.EMAIL_NOT_FOUND;
  }
  
  if (message.includes('rate limit')) {
    return ErrorCode.RATE_LIMITED;
  }
  
  if (message.includes('network')) {
    return ErrorCode.NETWORK_ERROR;
  }
  
  return ErrorCode.UNKNOWN_ERROR;
}; 