import { Flow } from "pocketflow";
import { loadSharedStore, saveSharedStore } from "../supabase/queries";
import { FirstMessageNode, CheckConfirmationNode, AskForEmailNode, ParseEmailOrConfirmationNode, VerifyAndLinkNode, ChatNode } from "./nodes";
import { SharedStore } from "./types";
import { sendWhatsAppMessage } from "../twilio";
import { addMessageToGlobalGraph, addUserMessage } from "../zep/client";
// import {
//   CheckConfirmationNode,
//   AskForEmailNode,
//   ParseEmailOrConfirmationNode,
//   VerifyAndLinkNode,
//   ChatNode,
//   SharedStore,
// } from "./nodes";
// import { loadSharedStore, saveSharedStore } from "../utils"; // adjust path


export function createConfirmThenChatFlow(): Flow<SharedStore> {
  const firstMessage = new FirstMessageNode();
  const check = new CheckConfirmationNode();
  const ask = new AskForEmailNode();
  const parse = new ParseEmailOrConfirmationNode();
  const verify = new VerifyAndLinkNode();
  const chat = new ChatNode();

  // New wiring: start with FirstMessageNode
  firstMessage
    .on("respond_and_ask_email", ask)
    .on("parse_email", parse)
    .on("chat", chat);

  // Original wiring for email confirmation flow
  check
    .on("confirmed", chat)
    .on("parse", parse)
    .on("ask", ask);

  parse.on("got_email", verify).on("ask_again", ask);
  verify.on("confirmed", chat).on("ask_again", ask);

  return new Flow<SharedStore>(firstMessage);
}


// Convenience runner for your webhook handler
export async function runSessionedFlow(args: {
  sessionId: string;
  fromPhone: string; // raw Twilio WhatsApp From is fine
  message: string;
  profileName?: string; // optional hint to set firstName if missing
}): Promise<{ aiResponse: string; shared: SharedStore }> {
  const { sessionId, fromPhone, message, profileName } = args;


  // Load persisted shared state
  const { shared, version } = await loadSharedStore(sessionId);


  // Initialize defaults
  shared.user = shared.user || {};
  shared.messages = shared.messages || [];

  // Normalize and set inputs
  shared.user.phone = fromPhone.replace(/^whatsapp:/, "");
  shared.sessionId = sessionId;
  if (!shared.user.firstName && profileName) {
    shared.user.firstName = profileName.split(" ")[0];
    shared.user.lastName = profileName.split(" ")[1];
  }
  shared.incomingMessage = message;
  shared.aiResponse = undefined;


  // Run flow
  const flow = createConfirmThenChatFlow();
  await flow.run(shared);

  await sendWhatsAppMessage(shared.user.phone, shared.aiResponse || "");

  // zep
  // await addUserMessage(shared);
  await addMessageToGlobalGraph(shared);

  // Persist
  await saveSharedStore(sessionId, shared, version);

  // await sendWhatsAppMessage(

  // )


  return { aiResponse: shared.aiResponse || "", shared };
}