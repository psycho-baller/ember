import { createClient } from "@/lib/supabase/server";
import { ClubMatch, SharedStore } from "../pocketflow/types";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { log } from "console";
import { env } from "@/lib/env";

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

/**
 * Fetch candidate emails filtered by university and excluding accounts with phone numbers
 */
export async function fetchAvailableCandidateEmails(firstName: string): Promise<string[]> {
  const supabase = await createClient();

  // Determine university domain based on current location
  const universityDomain = env.LOCATION_ID === "uofc" ? "@ucalgary.ca" : "@uwaterloo.ca";

  const { data, error } = await supabase.rpc('search_available_emails_by_first', {
    prefix: firstName,
    university_domain: universityDomain,
    limit_count: 5
  });

  console.log('Available candidate emails:', data, error);
  if (error) throw error;
  return (data ?? []).map((r: { email: string }) => r.email);
}

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const supabase = await createClient();
  // mock emails for testing
  if (process.env.ZEP_GRAPH_ID?.includes("mock")) {
    if (email === "chris.thompson@ucalgary.ca") return process.env.REAL_MOCK_USER_ID!;
    if (email === "alice.smith@ucalgary.ca") return process.env.REAL_MOCK_USER_ID!;
    if (email === "bob.johnson@ucalgary.ca") return process.env.POP_USER_ID!;
    if (email === "jamie.lee@ucalgary.ca") return process.env.REAL_MOCK_USER_ID!;
    if (email === "alex.kim@ucalgary.ca") return process.env.REAL_MOCK_USER_ID!;
    if (email === "henry.davis@ucalgary.ca") return process.env.REAL_MOCK_USER_ID!;
    return process.env.REAL_MOCK_USER_ID!;
  }

  const { data, error } = await supabase.rpc("get_user_id_by_email", {
    p_email: email,
  });
  if (error) return null;
  return data ?? null; // data is uuid or null
}

export async function getPhoneNumberById(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('phone_number').eq('id', id).single();
  if (error) return null;
  return data?.phone_number ?? null;
}

export async function getPhoneNumberByEmail(email: string): Promise<string | null> {
  // mock emails for testing
  if (process.env.ZEP_GRAPH_ID?.includes("mock")) {
    if (email === "chris.thompson@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    if (email === "alice.smith@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    if (email === "bob.johnson@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    if (email === "jamie.lee@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    if (email === "alex.kim@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    if (email === "henry.davis@ucalgary.ca") return process.env.RAMI_PHONE_NUMBER!;
    return process.env.RAMI_PHONE_NUMBER!;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('phone_number').eq('email', email).single();
  if (error) return null;
  return data?.phone_number ?? null;
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

/**
 * Determine which university an email belongs to
 */
export function getUniversityFromEmail(email: string): "uofc" | "uw" | "unknown" {
  if (email.endsWith("@ucalgary.ca")) return "uofc";
  if (email.endsWith("@uwaterloo.ca")) return "uw";
  return "unknown";
}

/**
 * Extract first name from email based on university format
 */
export function extractFirstNameFromEmail(email: string): string | null {
  const university = getUniversityFromEmail(email);
  const username = email.split('@')[0];

  if (university === "uofc") {
    // University of Calgary: firstname.lastname@ucalgary.ca
    const parts = username.split('.');
    return parts.length > 0 ? parts[0] : null;
  } else if (university === "uw") {
    // University of Waterloo: flastname@uwaterloo.ca (first letter + lastname)
    return username.length > 0 ? username[0] : null;
  }

  return null;
}

/**
 * Generate possible email formats for a given first and last name
 */
export function generatePossibleEmails(firstName: string, lastName: string, university: "uofc" | "uw"): string[] {
  const emails: string[] = [];

  if (university === "uofc") {
    // University of Calgary format: firstname.lastname@ucalgary.ca
    emails.push(`${firstName.toLowerCase()}.${lastName.toLowerCase()}@ucalgary.ca`);
  } else if (university === "uw") {
    // University of Waterloo format: flastname@uwaterloo.ca
    emails.push(`${firstName[0].toLowerCase()}${lastName.toLowerCase()}@uwaterloo.ca`);
  }

  return emails;
}

/**
 * Check if a first name matches an email based on university format
 */
export function doesFirstNameMatchEmail(firstName: string, email: string): boolean {
  const university = getUniversityFromEmail(email);
  const username = email.split('@')[0];

  if (university === "uofc") {
    // University of Calgary: firstname.lastname@ucalgary.ca
    const emailFirstName = username.split('.')[0];
    return emailFirstName.toLowerCase() === firstName.toLowerCase();
  } else if (university === "uw") {
    // University of Waterloo: flastname@uwaterloo.ca
    const firstLetter = username[0];
    return firstLetter.toLowerCase() === firstName[0].toLowerCase();
  }

  return false;
}

/**
 * Check if an email is from the current university context
 */
export function isFromCurrentUniversity(email: string): boolean {
  const emailUniversity = getUniversityFromEmail(email);
  return emailUniversity === env.LOCATION_ID;
}

/**
 * Check if a profile has a phone number linked
 */
export async function hasPhoneNumber(email: string): Promise<boolean> {
  const phoneNumber = await getPhoneNumberByEmail(email);
  return phoneNumber !== null && phoneNumber.trim() !== "";
}

/**
 * Find available emails (no phone number) from the same university as the current context
 * This is the optimized version using the database function
 */
export async function findAvailableUniversityEmails(firstName: string): Promise<string[]> {
  return await fetchAvailableCandidateEmails(firstName);
}

/**
 * Find available emails (no phone number) from the same university as the current context
 * This is the fallback version using JavaScript filtering with university-specific email format matching
 */
export async function findAvailableUniversityEmailsJS(firstName: string): Promise<string[]> {
  // First get all candidate emails
  const candidateEmails = await fetchCandidateEmails(firstName);

  // Filter by university, email format, and phone number availability
  const availableEmails: string[] = [];

  for (const email of candidateEmails) {
    // Check if email is from current university
    if (!isFromCurrentUniversity(email)) {
      console.log(`Skipping ${email} - not from current university (${env.LOCATION_ID})`);
      continue;
    }

    // Check if first name matches email format for the university
    if (!doesFirstNameMatchEmail(firstName, email)) {
      console.log(`Skipping ${email} - first name doesn't match university email format`);
      continue;
    }

    // Check if email already has a phone number
    const hasPhone = await hasPhoneNumber(email);
    if (hasPhone) {
      console.log(`Skipping ${email} - already has phone number`);
      continue;
    }

    availableEmails.push(email);
  }

  return availableEmails;
}

/**
 * Get detailed information about a user including university and phone status
 */
export async function getUserUniversityStatus(email: string): Promise<{
  email: string;
  university: "uofc" | "uw" | "unknown";
  hasPhone: boolean;
  fullName: string;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_user_university_status', {
    user_email: email
  });

  if (error || !data || data.length === 0) {
    console.log('No user found for email:', email, error);
    return null;
  }

  const user = data[0];
  return {
    email: user.email,
    university: user.university as "uofc" | "uw" | "unknown",
    hasPhone: user.has_phone,
    fullName: user.full_name
  };
}

/**
 * Find and suggest available emails based on first and last name
 */
export async function suggestAvailableEmails(firstName: string, lastName?: string): Promise<{
  exactMatches: string[];
  suggestions: string[];
  university: "uofc" | "uw";
}> {
  const university = env.LOCATION_ID as "uofc" | "uw";

  // Get emails that match the first name pattern
  const firstNameMatches = await findAvailableUniversityEmails(firstName);

  const result = {
    exactMatches: firstNameMatches,
    suggestions: [] as string[],
    university
  };

  // If we have a last name, generate possible email formats
  if (lastName) {
    const possibleEmails = generatePossibleEmails(firstName, lastName, university);

    // Check which of the generated emails exist and are available
    for (const email of possibleEmails) {
      const userStatus = await getUserUniversityStatus(email);
      if (userStatus && !userStatus.hasPhone) {
        result.suggestions.push(email);
      }
    }
  }

  return result;
}

/**
 * Comprehensive function to handle email confirmation and phone linking
 * This validates university, checks availability, and links the phone number
 */
export async function confirmEmailAndLinkPhone(
  email: string,
  phoneNumber: string
): Promise<{
  success: boolean;
  message: string;
  userId?: string;
  university?: "uofc" | "uw" | "unknown";
}> {
  try {
    // 1. Get user status
    const userStatus = await getUserUniversityStatus(email);

    if (!userStatus) {
      return {
        success: false,
        message: "Email not found in our system"
      };
    }

    // 2. Check if email is from correct university
    if (userStatus.university !== env.LOCATION_ID) {
      return {
        success: false,
        message: `This email is from ${userStatus.university === "uofc" ? "University of Calgary" : userStatus.university === "uw" ? "University of Waterloo" : "an unknown university"}, but you're trying to connect from ${env.LOCATION_ID === "uofc" ? "University of Calgary" : "University of Waterloo"}`
      };
    }

    // 3. Check if email already has a phone number
    if (userStatus.hasPhone) {
      return {
        success: false,
        message: "This email already has a phone number connected to it. Please use a different email or contact support."
      };
    }

    // 4. Link the phone number
    const userId = await linkPhoneToProfile(email, phoneNumber);

    return {
      success: true,
      message: "Successfully linked phone number to email",
      userId,
      university: userStatus.university
    };

  } catch (error) {
    console.error('Error confirming email and linking phone:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
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


// ---- Warm intros -----------------------------------------------------------
export async function createWarmIntro(input: {
  from_first_name: string;
  from_last_name: string;
  from_email: string;
  to_first_name: string;
  to_last_name: string;
  to_email: string;
  intro_message: string;
  delivery_medium?: 'email' | 'whatsapp';
}): Promise<{ id: string } | null> {
  const supabase = await createClient();

  // Resolve profile ids by email
  const fromId = await getUserIdByEmail(input.from_email);
  const toId = await getUserIdByEmail(input.to_email);
  if (!fromId || !toId) {
    throw new Error(`Unable to find user with email $${input.to_email}`);
  }

  const payload = {
    from_profile_id: fromId,
    to_profile_id: toId,
    // from_first_name: input.from_first_name,
    // from_last_name: input.from_last_name,
    // from_email: input.from_email,
    // to_first_name: input.to_first_name,
    // to_last_name: input.to_last_name,
    // to_email: input.to_email,
    intro_message: input.intro_message,
    delivery_medium: input.delivery_medium ?? 'whatsapp',
  };

  const { data, error } = await supabase
    .from('warm_intros')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return data as { id: string };
}



// ---- 1) Vector search: embed the query, call Supabase RPC, return matches ----
/**
 * searchClubs
 * - Embeds the user query (text-embedding-3-small, 1536-d)
 * - Calls Supabase RPC (match_clubs) to retrieve top-k similar clubs
 * - Optional keyword prefilter via Postgres full-text (set keyword to narrow domain)
 */
export async function searchClubs(opts: {
  query: string;
  k?: number;                  // top-k, default 8
  minSimilarity?: number;      // 0..1 cosine-based similarity threshold
  keyword?: string | null;     // optional hybrid keyword filtero
}): Promise<ClubMatch[]> {
  const supabase = await createClient();

  const { query, k = 8, minSimilarity = 0.3, keyword = null } = opts;

  // 1) Embed the query with Vercel AI SDK + OpenAI provider
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  });

  // 2) Vector search via RPC
  const { data, error } = await supabase.rpc('match_clubs', {
    query_embedding: embedding,
    match_count: k,
    min_similarity: minSimilarity,
    keyword,
    p_university: env.LOCATION_ID,
  });
  log("searchClubs", { query, k, minSimilarity, keyword, data, error });

  if (error) {
    throw new Error(`match_clubs RPC failed: ${error.message}`);
  }

  // Data already includes similarity; ensure typing
  return (data ?? []) as ClubMatch[];
}

export async function checkIfIntroExists(from_email: string, to_email: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('warm_intros')
    .select('id')
    .eq('from_email', from_email)
    .eq('to_email', to_email)
    .single();
  if (error) return false;
  return true;
}
