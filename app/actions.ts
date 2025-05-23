"use server";

import { redirect } from "next/navigation";
import { encodedRedirect } from "@/utils/redirect";
import { ErrorCode, handleAuthError } from "@/utils/errors";
import { createSupabaseClient } from "@/utils/supabase/server";

// Simple email validation function
function isEmail(email: string): boolean {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

// Basic password strength check
function isPasswordStrong(password: string): boolean {
  return password.length >= 8; // Minimum 8 characters
}

export const signInAction = async (formData: FormData) => {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  
  // Validate data types
  if (!emailValue || typeof emailValue !== "string") {
    return handleAuthError(ErrorCode.INVALID_EMAIL);
  }
  
  if (!passwordValue || typeof passwordValue !== "string") {
    return handleAuthError(ErrorCode.INVALID_PASSWORD);
  }
  
  const email = emailValue.trim();
  const password = passwordValue;

  // Input validation
  if (!isEmail(email)) {
    return handleAuthError(ErrorCode.INVALID_EMAIL);
  }

  if (password.length < 6) {
    return handleAuthError(ErrorCode.INVALID_PASSWORD);
  }

  const client = await createSupabaseClient();
  
  // First, try to sign in with the provided credentials
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  // If there's no error, the sign-in was successful
  if (!signInError) {
    return redirect("/protected");
  }

  // Check if error is related to email confirmation
  if (signInError.message.toLowerCase().includes('email not confirmed')) {
    return handleAuthError(ErrorCode.EMAIL_NOT_CONFIRMED, "/email-confirmation", { email });
  }
  
  // For invalid credentials, we need to check if the account exists
  if (signInError.message.toLowerCase().includes('invalid login credentials')) {
    console.log(`[SIGNIN] Checking if account exists for email: ${email.substring(0, 3)}...`);
    
    // Try to check if the account exists using a fake password
    try {
      // Use a completely different password to avoid any chance of accidentally logging in
      const randomPassword = `check-only-${Math.random()}`;
      
      const { error: checkError } = await client.auth.signInWithPassword({
        email,
        password: randomPassword,
      });
      
      console.log(`[SIGNIN] Account check result:`, { 
        errorMessage: checkError?.message,
        errorStatus: checkError?.status
      });
      
      // If we get a different error or no error (shouldn't happen), the account exists
      if (checkError) {
        // Check for email confirmation error, which confirms account exists
        if (checkError.message.toLowerCase().includes('email not confirmed')) {
          return handleAuthError(ErrorCode.EMAIL_NOT_CONFIRMED, "/email-confirmation", { email });
        }
        
        // If we get the same "invalid credentials" error, check further for account existence
        if (checkError.message.toLowerCase().includes('invalid login credentials')) {
          // Try one more check using passwordless sign-in
          try {
            const { error: otpError } = await client.auth.signInWithOtp({
              email,
              options: { 
                shouldCreateUser: false 
              }
            });
            
            console.log(`[SIGNIN] OTP check result:`, { 
              errorMessage: otpError?.message 
            });
            
            // If OTP method says email not found, account definitely doesn't exist
            if (otpError && (
              otpError.message.toLowerCase().includes('email not found') || 
              otpError.message.toLowerCase().includes('user not found')
            )) {
              return handleAuthError(ErrorCode.NO_ACCOUNT);
            }
          } catch (e) {
            console.error(`[SIGNIN] OTP check error:`, e);
          }
        }
      }
    } catch (e) {
      console.error(`[SIGNIN] Account check error:`, e);
    }
    
    // If we get here, the most likely case is wrong password for existing account
    return handleAuthError(ErrorCode.INVALID_CREDENTIALS);
  }
  
  // For any other unexpected error, return invalid credentials
  return handleAuthError(ErrorCode.INVALID_CREDENTIALS);
};

export const signUpAction = async (formData: FormData) => {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  
  // Validate data types
  if (!emailValue || typeof emailValue !== "string") {
    console.error(`[SIGNUP] Invalid email format: not a string`);
    return encodedRedirect("/sign-in", "invalid_email");
  }
  
  if (!passwordValue || typeof passwordValue !== "string") {
    console.error(`[SIGNUP] Invalid password format: not a string`);
    return encodedRedirect("/sign-in", "invalid_password");
  }
  
  const email = emailValue.trim();
  const password = passwordValue;
  const client = await createSupabaseClient();

  console.log(`[SIGNUP] Starting sign-up process for email: ${email.substring(0, 3)}...`);

  // Validation errors
  if (!isEmail(email)) {
    console.error(`[SIGNUP] Invalid email format`);
    return encodedRedirect("/sign-in", "invalid_email");
  }

  if (!isPasswordStrong(password)) {
    console.error(`[SIGNUP] Password too weak`);
    return encodedRedirect("/sign-in", "weak_password");
  }

  // All email existence checks (Methods 1-3) should use the same error format
  const emailExistsError = () => {
    console.log(`[SIGNUP] Email exists, redirecting to sign-in`);
    return encodedRedirect("/sign-in", "already_exists");
  };

  // ======== METHOD 1: Try to get user by email with admin API ========
  try {
    console.log(`[SIGNUP] METHOD 1: Attempting admin.listUsers for ${email.substring(0, 3)}...`);
    // Note: This requires admin privileges and may not work with public-facing APIs
    // This method may not be available in all Supabase installs - will likely fail
    const { data, error: listError } = await client.auth.admin.listUsers();
    
    const users = data?.users?.filter(user => user.email === email);
    
    console.log(`[SIGNUP] METHOD 1 result:`, { 
      usersFound: users?.length > 0, 
      error: !!listError 
    });
    
    if (users && users.length > 0) {
      console.log(`[SIGNUP] METHOD 1: User exists for email: ${email.substring(0, 3)}...`);
      return emailExistsError();
    }
  } catch (err) {
    console.error(`[SIGNUP] METHOD 1 error: Admin API likely not available`, err);
  }
  
  // ======== METHOD 2: Try passwordless sign-in to see if email exists ========
  try {
    console.log(`[SIGNUP] METHOD 2: Trying passwordless sign-in for ${email.substring(0, 3)}...`);
    const { error: magicLinkError } = await client.auth.signInWithOtp({
      email,
      options: {
        // Don't actually send the email
        shouldCreateUser: false,
      }
    });
    
    console.log(`[SIGNUP] METHOD 2 result:`, { error: magicLinkError?.message });
    
    if (magicLinkError) {
      if (magicLinkError.message.toLowerCase().includes('email not found')) {
        console.log(`[SIGNUP] METHOD 2: Email not found, user does not exist`);
        // Email doesn't exist, continue with sign-up
      } else {
        console.log(`[SIGNUP] METHOD 2: User might exist, error: ${magicLinkError.message}`);
        // Any other error might indicate the user exists
        if (!magicLinkError.message.toLowerCase().includes('rate limit') && 
            !magicLinkError.message.toLowerCase().includes('network')) {
          return emailExistsError();
        }
      }
    } else {
      console.log(`[SIGNUP] METHOD 2: No error, OTP request succeeded, user likely exists`);
      return emailExistsError();
    }
  } catch (err) {
    console.error(`[SIGNUP] METHOD 2 error:`, err);
  }

  // ======== METHOD 3: Try login with fake password ========
  try {
    console.log(`[SIGNUP] METHOD 3: Trying login with fake password for ${email.substring(0, 3)}...`);
    const { error: signInError } = await client.auth.signInWithPassword({
      email,
      password: "checkonly" + Math.random(),
    });
    
    console.log(`[SIGNUP] METHOD 3 result:`, { error: signInError?.message });
    
    if (signInError) {
      if (signInError.message.toLowerCase().includes('invalid login credentials')) {
        console.log(`[SIGNUP] METHOD 3: Invalid credentials, user likely exists`);
        return emailExistsError();
      } else if (signInError.message.toLowerCase().includes('email not confirmed')) {
        console.log(`[SIGNUP] METHOD 3: Email not confirmed, user exists`);
        return emailExistsError();
      }
    }
  } catch (err) {
    console.error(`[SIGNUP] METHOD 3 error:`, err);
  }

  // ======== METHOD 4: Try the actual sign-up ========
  console.log(`[SIGNUP] METHOD 4: Proceeding with actual sign-up for ${email.substring(0, 3)}...`);
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    }
  });

  console.log(`[SIGNUP] METHOD 4 result:`, { 
    success: !error, 
    error: error?.message, 
    status: error?.status,
    user: data?.user ? 'exists' : 'null',
    confirmed: data?.user?.email_confirmed_at ? 'yes' : 'no',
    identities: data?.user?.identities?.length || 0
  });

  if (error) {
    console.error(`[SIGNUP] Error:`, error.message);
    
    const errorMsg = error.message.toLowerCase();
    const isDuplicateEmailError = 
      errorMsg.includes('email already') || 
      errorMsg.includes('already registered') || 
      errorMsg.includes('duplicate') ||
      errorMsg.includes('already exists') ||
      errorMsg.includes('already in use') ||
      errorMsg.includes('already taken') ||
      errorMsg.includes('user already') ||
      errorMsg.includes('already signed up') ||
      errorMsg.includes('already been registered') ||
      (error.status === 400 && errorMsg.includes('email'));
    
    if (isDuplicateEmailError) {
      return emailExistsError();
    }
    
    // Generic error case
    return encodedRedirect("/sign-in", "unknown");
  }

  // Handle unconfirmed existing user
  if (data?.user && data.user.identities?.length === 0 && !data.user.email_confirmed_at) {
    console.log(`[SIGNUP] Detected unconfirmed user`);
    if (data.user.id) {
      return emailExistsError();
    }
  }

  // Success cases
  if (!data?.user?.email_confirmed_at) {
    console.log(`[SIGNUP] Success, email confirmation required`);
    return encodedRedirect("/email-confirmation", "pending");
  }

  console.log(`[SIGNUP] Success, email already confirmed`);
  return redirect("/protected");
};

export const googleSignInAction = async () => {
  const client = await createSupabaseClient();
  
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return encodedRedirect("/sign-in", "google_error");
  }

  return redirect(data.url);
};

export const signOutAction = async () => {
  const client = await createSupabaseClient();
  await client.auth.signOut();
  return redirect("/sign-in");
};

export const resendConfirmationEmail = async (email: string) => {
  const client = await createSupabaseClient();
  
  const { error } = await client.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes('Email already confirmed')) {
      return encodedRedirect("/sign-in", "already_confirmed");
    }
    
    if (error.message.includes('Email not found')) {
      return encodedRedirect("/email-confirmation", "not_found");
    }
    
    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes('already exists') || 
        errorMsg.includes('already in use') || 
        errorMsg.includes('already taken') ||
        errorMsg.includes('user already')) {
      return encodedRedirect("/sign-in", "already_exists");
    }
    
    return encodedRedirect("/email-confirmation", "send_failed");
  }

  return encodedRedirect("/email-confirmation", "resent");
};