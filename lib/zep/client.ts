import { ZepClient, Zep } from "@getzep/zep-cloud";
import { getWeek } from "date-fns";
import { SharedStore } from "../pocketflow/types";
import { getUserIdByEmail } from "../supabase/queries";

const API_KEY = process.env.ZEP_API_KEY;

export const client = new ZepClient({
  apiKey: API_KEY,
});


export async function addUserMessage(userData: SharedStore) {
  // Step 1: Check if user exists
  let userExists = true;
  const userId = await getUserIdByEmail(userData.user?.email!);
  if (!userId) {
    return;
  }
  try {
    const user = await client.user.get(userId);
    console.log("user", user);
  } catch (err: any) {
    if (err.statusCode === 404) {
      console.log("user not found");
      userExists = false;
    } else {
      console.log("user not found", err);
      throw err; // rethrow other errors
    }
  }

  // Step 2: Create user if not exists
  if (!userExists) {
    console.log("user not found, creating");
    await client.user.add({ userId, email: userData.user?.email, firstName: userData.user?.firstName, lastName: userData.user?.lastName }); // Add more fields as needed
  }

  if (!userData.incomingMessage) {
    console.log("no message");
    return;
  }

  // Step 3: Create a new thread for the user
  // weekly thread
  const today = new Date();
  const weekNumber = getWeek(today, { weekStartsOn: 1 });
  const threadId = `${userId}-${weekNumber}`;
  // check if thread exists
  try {
    await client.thread.get(threadId);
  } catch (err: any) {
    if (err.statusCode === 404) {
      console.log("thread not found, creating");
      await client.thread.create({ threadId, userId });
    } else {
      console.log("thread not found", err);
      throw err; // rethrow other errors
    }
  }
  // Step 4: Add the message to the thread
  const messages: Zep.Message[] = [{
    name: userData.user?.firstName || "User",
    role: "user",
    content: userData.incomingMessage,
    // 5 seconds earlier
    createdAt: new Date(today.getTime() - 5 * 1000).toISOString(),
  }, {
    name: "Ember",
    role: "assistant",
    content: userData.aiResponse || "",
    createdAt: today.toISOString(),
  }];
  const { context, messageUuids } = await client.thread.addMessages(threadId, { messages, returnContext: true });
  console.log("context", context);
  console.log("messageUuids", messageUuids);
  return { context, messageUuids };
}

// export