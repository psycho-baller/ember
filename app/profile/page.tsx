import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";
import PhoneNumberForm from "@/components/phone-number-form";
import PhoneButton from "@/components/secondary-button-link/phone-button";

// Dynamically import the client component to avoid SSR issues
// const PhoneNumberForm = dynamic(
//   () => import("@/components/phone-number-form"),
//   { ssr: false }
// );

// const PhoneButton = dynamic(
//   () => import("@/components/secondary-button-link/phone-button"),
//   { ssr: false }
// );

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/");
  }

  // Get user profile with phone number
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("id", user.id)
    .single();

  const hasPhoneNumber = !!profile?.phone_number;
  const vapi_phone_number = "+1234567890"; // Your support number

  return (
    <div className="w-full max-w-md px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">
          {hasPhoneNumber ? "Ready to call Ember?" : "Add Your Phone Number"}
        </h1>

        {hasPhoneNumber ? (
          <>
            <p className="text-muted-foreground mb-8">
              Call us at: <span className="font-mono">{vapi_phone_number}</span>
            </p>
            <div className="flex justify-center">
              <PhoneButton
                phoneNumber={vapi_phone_number}
                className="text-lg py-6 px-8 w-full max-w-xs"
              >
                Call Support
              </PhoneButton>
            </div>
          </>
        ) : (
          <div className="text-left">
            <p className="text-muted-foreground mb-6">
              To get started, please provide your US or Canadian phone number. We'll use this to connect you with potential matches.
            </p>
            <PhoneNumberForm />
          </div>
        )}
      </div>
    </div>
  );
}
