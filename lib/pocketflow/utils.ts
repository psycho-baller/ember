

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
  const activityLex = /\b(i (?:love|like|enjoy|play|practice|do) (?:playing )?(?:\w+ing|\w+ball|soccer|basketball|volleyball|hockey|tennis|badminton|swimming|dancing|singing|acting|reading|writing|drawing|painting|photography|hiking|running|yoga|martial arts|chess|gaming|video games|esports))\b/;
  if (activityLex.test(text)) { score += 2; reasons.push("activity_mentioned"); }

  return { match: score >= 2, score, reasons };
}

// Simple boolean wrapper (drop-in for your old method)
export function isAskingAboutClubs(message: string): boolean {
  return detectClubIntent(message).match;
}