import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthResponse {
  data: {
    user: {
      id: string;
      email?: string;
    } | null;
    session: any | null;
  } | null;
  error: Error | null;
}

export const useEmailSignup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Check localStorage on initial load
  useEffect(() => {
    const email = localStorage.getItem('waitlistEmail');
    setWaitlistEmail(email);
  }, []);

  const signUpWithEmail = async (email: string) => {
    setIsLoading(true);
    try {
      const isUCalgaryEmail = email.endsWith('@ucalgary.ca');

      if (isUCalgaryEmail) {
        // For UCalgary emails, send magic link for passwordless sign in
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            shouldCreateUser: true,
          },
        }) as unknown as AuthResponse;

        if (error) throw error;

        // Add to users table
        if (data?.user) {
          const { error: userError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: data.user.id,
                email,
                email_verified: false,
              },
              { onConflict: 'email' }
            );

          if (userError) {
            console.error('User error:', userError);
          }
        }

        toast({
          title: "Check your email!",
          description: `We've sent a magic link to ${email}. Click it to sign in.`,
        });

        return { success: true, user: data?.user };
      } else {
        // For non-UCalgary emails, just add to waitlist
        const { error: waitlistError } = await supabase
          .from('email_waitlist')
          .insert(
            {
              email,
            }
          );

        if (waitlistError) {
          throw new Error('Failed to add to waitlist. Please try again.');
        }

        // Store the email in localStorage
        localStorage.setItem('waitlistEmail', email);
        setWaitlistEmail(email);

        toast({
          title: "Thanks for your interest!",
          description: "We've added you to our waitlist. We'll notify you when we expand to your university!",
        });

        return { success: true, user: null };
      }
    } catch (error: any) {
      console.error('Email signup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // This function can be used to check the auth state
  const checkAuthState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user;
  };

  // This function can be used to sign out
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    signUpWithEmail,
    checkAuthState,
    signOut,
    isLoading,
    waitlistEmail
  };
};