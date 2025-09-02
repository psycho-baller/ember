import { ModelMessage } from "ai";
import { log } from "console";
import { callLlmJson, callLlm } from "../llm";
import { EXTRACT_USER_INFO_FOR_CLUB_MATCHING_PROMPT, SUGGEST_CLUBS_PROMPT } from "../prompts";
import { searchClubs } from "../supabase/queries";
import { sendWhatsAppMessage } from "../twilio";
import { z } from "zod";


// Stronger detector: combines lexicons, patterns, campus context, and negatives.
export function detectClubIntent(message: string): { match: boolean; score: number; reasons: string[] } {
  const text = message
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, ""); // strip diacritics

  const reasons: string[] = [];
  let score = 0;

  // Hard negatives to avoid false triggers
  const negatives = /\b(night ?club|club sandwich|club soda|club penguin|golf club(?! team| club))\b/;
  if (negatives.test(text)) return { match: false, score: 0, reasons: ["negative_context"] };

  // Direct club/association terms
  const clubLex = /\b(club|clubs|societ(?:y|ies)|organization|orgs?|association|student union|guild|group|extracurriculars?|intramurals?|club ?fair|freshers'? ?fair|orientation ?fair)\b/;
  if (clubLex.test(text)) { score += 2; reasons.push("club_lexicon"); }

  // Joining / searching intent
  const joinLex = /\b(join|sign ?up|get involved|how (?:to )?join|looking (?:to|for) (?:join|clubs?)|find (?:a )?club|recommended clubs?)\b/;
  if (joinLex.test(text)) { score += 1; reasons.push("join_intent"); }

  // Talking about interests/hobbies
  const hobbyLang = /\b(i (?:like|love|enjoy|am into|do|play|practice|study)|my (?:hobby|hobbies) (?:is|are)|i(?:'m| am) interested in)\b/;
  if (hobbyLang.test(text)) { score += 1; reasons.push("hobby_language"); }

  // Campus context
  const campusCtx = /\b(on[- ]?campus|at (?:uni|university|college)|campus|student life|student services)\b/;
  if (campusCtx.test(text)) { score += 1; reasons.push("campus_context"); }

  // Social motivation
  const socialLex = /\b(meet (?:new )?people|make friends|sociali[sz]e|what to do|activities?)\b/;
  if (socialLex.test(text)) { score += 1; reasons.push("social_motive"); }

  // Detect standalone sports/hobbies (e.g., "I love playing basketball")
  const activityLex = /\b((?:playing )?(?:\w+ing|\w+ball|soccer|basketball|volleyball|hockey|tennis|badminton|swimming|dancing|singing|acting|reading|writing|drawing|painting|photography|hiking|running|yoga|martial arts|chess|gaming|video games|esports))\b/;
  if (activityLex.test(text)) { score += 2; reasons.push("activity_mentioned"); }

  return { match: score >= 1, score, reasons };
}

// Simple boolean wrapper (drop-in for your old method)
export function isAskingAboutClubs(message: string): boolean {
  return detectClubIntent(message).match;
}

export async function handleClubRecommendations(messages: ModelMessage[], userPhone: string): Promise<void> {
  // get the 2 most recent user messages
  const lastSixMessages = messages.slice(-6);
  const lastTwoUserMessages = lastSixMessages.filter(m => m.role === "user").slice(-2);
  const lastUserMsg = lastTwoUserMessages[0].content as string;
  const secondLastUserMsg = lastTwoUserMessages[1].content as string;
  if (!isAskingAboutClubs(lastUserMsg) && !isAskingAboutClubs(secondLastUserMsg)) {
    log("ChatNode", "handleClubRecommendations", { lastUserMsg, secondLastUserMsg, userPhone, isAskingAboutClubs: false });
    return;
  }

  try {
    const schema = z.object({
      lookingForClub: z.boolean().describe("Whether the user is asking for club recommendations"),
      detailedUserInfo: z.string().describe("Detailed user info").optional(),
    })
    const keyInfoFromRecentMessages = await callLlmJson<z.infer<typeof schema>>(EXTRACT_USER_INFO_FOR_CLUB_MATCHING_PROMPT(lastSixMessages), schema)
    log("ChatNode", "handleClubRecommendations", { lastUserMsg, userPhone, detailedUserInfo: keyInfoFromRecentMessages.detailedUserInfo });
    if (!keyInfoFromRecentMessages.lookingForClub) {
      log("ChatNode", "handleClubRecommendations", { lastUserMsg, userPhone, lookingForClub: false });
      return;
    }
    const detailedUserInfo = keyInfoFromRecentMessages.detailedUserInfo!;
    const clubs = await searchClubs({ query: detailedUserInfo });
    log("ChatNode", "handleClubRecommendations", { userMsg: lastUserMsg, userPhone, detailedUserInfo, clubs });

    // If we have matching clubs, generate and send recommendations
    if (clubs.length > 0) {
      const prompt = SUGGEST_CLUBS_PROMPT(detailedUserInfo, clubs);
      const recommendations = await callLlm([{ role: 'user', content: prompt }]);
      log("ChatNode", "handleClubRecommendations", { lastUserMsg, userPhone, clubs, recommendations });

      if (recommendations) {
        log("ChatNode", "handleClubRecommendations", { lastUserMsg, userPhone, clubs, recommendations });
        // Send recommendations as a separate message
        await sendWhatsAppMessage(userPhone, recommendations);
      }
    }
  } catch (error) {
    log("ChatNode", "handleClubRecommendations", { lastUserMsg, userPhone, error });
  }
}
