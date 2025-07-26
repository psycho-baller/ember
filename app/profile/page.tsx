import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import PhoneButton from "@/components/secondary-button-link/phone-button";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/");
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">Ready to call Ember?</h1>
        <p className="text-muted-foreground mb-8"></p>
        <div className="flex justify-center">
          <PhoneButton phoneNumber="+1234567890" className="text-lg py-6 px-8 w-full max-w-xs">
            Call Support
          </PhoneButton>
        </div>
      </div>
    </div>
  );
}
