import { createClient } from "@/lib/supabase/server";

export async function fetchCandidateEmails(firstName: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('search_emails_by_first', {
    prefix: firstName,
    limit_count: 5
  });
  console.log(data, error);
  if (error) throw error;
  return (data ?? []).map((r: { email: string }) => r.email);
}
