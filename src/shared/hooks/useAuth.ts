import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { auth } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<"password" | "otp" | null>(null);

  useEffect(() => {
    void auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      // Try to determine auth method from session metadata
      if (session?.user?.app_metadata?.provider === "email") {
        // If user has confirmed email, likely password auth
        // Otherwise might be OTP
        setAuthMethod(session.user.email_confirmed_at ? "password" : "otp");
      }
    });

    const {
      data: { subscription },
    } = auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session?.user?.app_metadata?.provider === "email") {
        setAuthMethod(session.user.email_confirmed_at ? "password" : "otp");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    // Note: Supabase doesn't require current password for authenticated users
    // This is just for UI validation if needed
    return auth.updatePassword(newPassword);
  };

  const requestPasswordReset = async (email: string) => {
    return auth.resetPasswordForEmail(email);
  };

  return {
    session,
    loading,
    authMethod,
    updateUserPassword,
    requestPasswordReset
  };
}
