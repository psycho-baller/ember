import { tool } from "ai";
import { z } from 'zod';
import { searchClubs } from "../supabase/queries";

export const clubRecommendationTool = tool({
  description: 'You have extensive knowledge on all the clubs in the University of Calgary, and your goal is to provide information on university clubs in UCalgary. Whether the student is looking for clubs that match their interests and preferences or just want to learn more about a club. You should use this tool to get the information needed to answer the user\'s query appropriately.',
  inputSchema: z.object({
    intent: z.enum(['club_recommendation', 'club_info']),
    keyInfo: z.string().describe("The key information that we need. Whether it's the user looking for clubs that match their interests and preferences or just want to learn more about a club. Make it very thorough and accurate."),
    interests: z.array(z.string()).describe('User interests and hobbies').optional(),
    preferences: z.string().describe('Additional preferences or requirements').optional(),
  }),
  execute: async ({ intent, keyInfo, interests, preferences }) => {
    // Combine all info for search
    const searchQuery = [
      intent === 'club_recommendation' ? 'recommend clubs for the user' : 'extract club information',
      keyInfo,
      interests?.join(' '),
      preferences
    ].filter(Boolean).join(' ');

    console.log("Search query:", searchQuery);

    const clubs = await searchClubs({ query: searchQuery });

    if (clubs.length === 0) {
      return {
        success: false,
        message: "There are no clubs that match the query. Continue learning more about the user to find the perfect club for them."
      };
    }

    // Format club recommendations
    const recommendations = clubs.slice(0, 5).map((club, idx) => ({
      // rank: idx + 1,
      name: club.name,
      description: club.description,
      summary: club.summary,
      similarity: club.similarity,
      url: club.url,
    }));
    console.log("Recommendations:", recommendations);
    return {
      success: true,
      clubs: recommendations,
      totalFound: clubs.length
    };
  },
});
