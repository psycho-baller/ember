import { ZepClient, Zep, ZepError } from "@getzep/zep-cloud";
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
  const userId = await getUserIdByEmail(userData.user?.email as string);
  if (!userId) {
    return;
  }
  try {
    const user = await client.user.get(userId);
    console.log("user", user);
  } catch (err: ZepError | unknown) {
    if (err instanceof ZepError && err.statusCode === 404) {
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
    await client.user.add({
      userId,
      email: userData.user?.email,
      firstName: userData.user?.firstName,
      lastName: userData.user?.lastName,
      metadata: {
        phone: userData.user?.phone,
      }
    }); // Add more fields as needed
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
    const { totalCount } = await client.thread.get(threadId);
    console.log("thread", totalCount);
    if (totalCount === 0) {
      console.log("thread not found, creating");
      await client.thread.create({ threadId, userId });
    }
  } catch (err: ZepError | unknown) {
    if (err instanceof ZepError && err.statusCode === 404) {
      console.log("thread not found (err), creating");
      await client.thread.create({ threadId, userId });
    } else {
      console.log("thread not found (err)", err);
      throw err; // rethrow other errors
    }
  }
  // Step 4: Add the message to the thread
  const messages: Zep.Message[] = [{
    name: userData.user?.firstName || "User",
    role: "user",
    content: userData.incomingMessage,
    createdAt: today.toISOString(),
  }];
  const { context, messageUuids } = await client.thread.addMessages(threadId, { messages, returnContext: true });
  console.log("context", context);
  console.log("messageUuids", messageUuids);
  return { context, messageUuids };
}

// export
export async function addMessageToGlobalGraph(userData: SharedStore) {
  const graphId = "all_users";
  const userId = await getUserIdByEmail(userData.user?.email as string);
  if (!userId) {
    console.log("user not found");
    return;
  }

  // 1. Check if the student node exists in the shared graph
  let searchResults;
  try {
    searchResults = await client.graph.search({
      graphId,
      query: userId,
      scope: "nodes",
      searchFilters: { nodeLabels: ["Student"] },
      limit: 1,
    });
  } catch (err: unknown) {
    console.log("user not found in shared graph. creating", err);
  }
  const userExists: boolean = searchResults?.nodes && searchResults.nodes.length > 0 || false;

  const mockUser = {
    student_id: userId + "_mck",
    student_first_name: "Sami",
    student_last_name: "Mck",
    student_email: "sami.mck@ucalgary.ca",
    student_phone: "+18242176081",
  };
  const mockUser2 = {
    student_id: userId + "_mck2",
    student_first_name: "Dana",
    student_last_name: "Kaslana",
    student_email: "dana.kaslana@ucalgary.ca",
    student_phone: "+15672176666",
  };
  // 2. If not, create the Student entity in the shared graph
  if (!userExists) {
    const studentData = {
      action: "Create_entity",
      entity_type: "Student",
      student_id: userId,
      student_first_name: mockUser.student_first_name,
      student_last_name: mockUser.student_last_name,
      student_email: mockUser.student_email,
      student_phone: mockUser.student_phone,
    };
    // make sure graph exists
    try {
      await client.graph.get(graphId);
    } catch (err: unknown) {
      console.log("graph not found, creating", err);
      await client.graph.create({ graphId });
      // wait for graph to be created
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    await client.graph.add({
      graphId,
      type: "json",
      data: JSON.stringify(studentData),
    });
  }

  // 3. Add the user's message as text to the shared graph
  if (!userData.incomingMessage) {
    console.log("no message");
    return;
  }

  const messageData = {
    actions: "create_entities && create_edges",
    entity_types_available: "Any entity from this list: Program, Course, Club, Topic, Trait, MeetupType, Goal, Dorm, Language. Make sure you connect that entity to the student who said that message. So If the student enjoys going to the gym, you should create a Trait entity and connect it to the Student entity with the INTERESTED_IN edge.",
    edge_types_available: "Any edge from this list: ENROLLED_IN, PREFERS_MEETUP, INTERESTED_IN, BELONGS_TO, HAS_GOAL, RESIDES_IN, SPEAKS, STUDIES_IN, MATCH_RECOMMENDED. Make sure you connect that edge to the student who said that message. So If the student enjoys going to the gym, you should create a Trait entity and connect it to the Student entity with the INTERESTED_IN edge.",
    from_student_id: userId,
    from_student_first_name: userData.user?.firstName || "",
    from_student_email: userData.user?.email,
    from_student_phone: userData.user?.phone,
    student_message: userData.incomingMessage,
    to: "AI matchmaker",
  };

  const mockMessageData = {
    // actions: "create_entities && create_edges",
    // entity_types_available: "Any entity from this list: Program, Course, Club, Topic, Trait, MeetupType, Goal, Dorm, Language",
    // edge_types_available: "Any edge from this list: ENROLLED_IN, PREFERS_MEETUP, INTERESTED_IN, BELONGS_TO, HAS_GOAL, RESIDES_IN, SPEAKS, STUDIES_IN, MATCH_RECOMMENDED. Make sure you connect that edge to the student who said that message",
    // from_student_id: mockUser.student_id,
    // from_student_first_name: mockUser.student_first_name,
    // from_student_email: mockUser.student_email,
    // from_student_phone: mockUser.student_phone,
    student_entity: {
      student_id: mockUser.student_id,
      student_first_name: mockUser.student_first_name,
      student_last_name: mockUser.student_last_name,
      student_email: mockUser.student_email,
      student_phone: mockUser.student_phone,
    },
    to: "AI matchmaker",
    student_message: `The student ${mockUser.student_first_name} said: "${userData.incomingMessage}"`,
  };

  // await client.graph.add({
  //   graphId,
  //   type: "json",
  //   data: JSON.stringify(mockMessageData),
  // });

  const studentMessage = `The student ${userData.user?.firstName} ${userData.user?.lastName} <${userData.user?.email}> said: "${userData.incomingMessage}"`;
  await client.graph.add({
    graphId,
    type: "text",
    data: studentMessage,
  });
}
