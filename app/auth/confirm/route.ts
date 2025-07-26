import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    try {
      const { error, data } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      
      if (!error) {
        // If verification is successful, redirect to the specified URL
        redirect(next);
      } else if (error.message.includes('Token has expired or is invalid')) {
        // If the token was already used (likely by Outlook's preview), 
        // redirect to a page that will check the session and redirect accordingly
        redirect(`/auth/callback?next=${encodeURIComponent(next)}`);
      } else {
        // For other errors, redirect to error page
        redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
      }
    } catch (error) {
      // If there's an error (like network issues), try the callback approach
      redirect(`/auth/callback?next=${encodeURIComponent(next)}`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`);
}
