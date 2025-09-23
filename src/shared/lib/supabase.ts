import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, AUTH_CONFIG } from "../../config";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLIC_ANON_KEY || SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, supabaseAnonKey);

export const auth = {
  // Password-based authentication methods
  signUp: async (email: string, password: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        // No email confirmation required if config says so
        emailRedirectTo: AUTH_CONFIG.REQUIRE_EMAIL_CONFIRMATION
          ? `${window.location.origin}/auth/callback`
          : undefined,
      },
    });
  },
  signInWithPassword: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  },
  resetPasswordForEmail: async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  },
  updatePassword: async (newPassword: string) => {
    return supabase.auth.updateUser({
      password: newPassword,
    });
  },

  // OTP-based authentication methods (existing)
  signInWithOtp: async (email: string) => {
    return supabase.auth.signInWithOtp({
      email,
      // Removed emailRedirectTo to send OTP code instead of magic link
    });
  },
  verifyOtp: async (email: string, token: string) => {
    return supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
  },

  // Common auth methods
  signOut: async () => supabase.auth.signOut(),
  getSession: async () => supabase.auth.getSession(),
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
