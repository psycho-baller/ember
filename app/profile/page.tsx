import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PhoneNumberForm from "@/components/phone-number-form";
import PhoneButton from "@/components/secondary-button-link/phone-button";

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

  return (
    <div className="w-full max-w-md px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">
          Ready to find your people?
        </h1>

        {hasPhoneNumber ? (
          <>
            <p className="text-muted-foreground mb-8">
              Call us at: <span className="font-mono">{process.env.VAPI_PHONE_NUMBER}</span>
            </p>
            <div className="flex justify-center">
              <PhoneButton
                phoneNumber={process.env.VAPI_PHONE_NUMBER!}
                className="text-lg py-6 px-8 w-full max-w-xs"
              >
                Call Ember
              </PhoneButton>
            </div>
          </>
        ) : (
          <div className="text-left">
            <p className="text-muted-foreground mb-6">
              I&apos;m excited to get to know you more! Just drop your phone number and I&apos;ll call you back as soon as possible
            </p>
            <PhoneNumberForm />
          </div>
        )}
      </div>
    </div>
  );
}
