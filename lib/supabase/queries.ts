import { createClient } from "@/lib/supabase/server";
import { SharedStore } from "../pocketflow/types";

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

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_user_id_by_email", {
    p_email: email,
  });
  if (error) return null;
  return data ?? null; // data is uuid or null
}

export async function linkPhoneToProfile(email: string, phone: string): Promise<string> {
  const supabase = await createClient();
  const userId = await getUserIdByEmail(email);
  if (!userId) throw new Error("User not found");
  console.log("linking", userId, phone);
  const { data, error } = await supabase.from('profiles').update({ phone_number: phone }).eq('id', userId).select("id").single()
  if (error) throw error;
  return data.id;
}


export async function loadSharedStore(sessionId: string): Promise<{ shared: SharedStore, version: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flow_sessions")
    .select("state, version")
    .eq("session_id", sessionId)
    .single();
  if (error && error.code !== "PGRST116") throw error; // not found OK
  return {
    shared: (data?.state as SharedStore) ?? ({} as SharedStore),
    version: data?.version ?? 0,
  };
}

export async function saveSharedStore(sessionId: string, shared: SharedStore, prevVersion: number) {
  const supabase = await createClient();
  // optimistic lock: only update if version matches
  const { error } = await supabase.rpc("pf_update_session", {
    p_session_id: sessionId,
    p_state: shared,
    p_prev_version: prevVersion
  });
  if (error) throw error;
}