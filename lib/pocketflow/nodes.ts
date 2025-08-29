import { Node } from "pocketflow";
import { SharedStore } from "./types";
import { fetchCandidateEmails } from "../supabase/queries";
import { sendWhatsAppMessage } from "../twilio";
import { callLlm } from "../llm";
import { pickBestEmail } from "../utils";


export class ResolveEmailNode extends Node<SharedStore> {
  async prep(shared: SharedStore): Promise<string> {
    return shared.user.firstName || "";
  }
  async exec(firstName: string): Promise<string | null> {
    const candidates = await fetchCandidateEmails(firstName);
    return pickBestEmail(firstName, candidates);
  }
  async post(shared: SharedStore, _: string, email: string | null): Promise<string> {
    if (!email) return "needs_confirmation";
    shared.user.email = email;
    console.log(shared);
    return "needs_confirmation";
  }
}

export class ConfirmEmailNode extends Node<SharedStore> {
  async prep(shared: SharedStore): Promise<[string, string]> {
    return [shared.user.phone || "", shared.user.email || ""];
  }
  async exec([phone, email]: [string, string]): Promise<string> {
    const msg = `We found your email as ${email}. Reply YES if this is correct.`;
    console.log(msg);
    await sendWhatsAppMessage(phone, msg);
    return email;
  }
  async post(shared: SharedStore): Promise<string> {
    shared.confirmationSent = true;
    return "default";
  }
}


export class GenerateResponseNode extends Node<SharedStore> {
  async prep(shared: SharedStore): Promise<string> {
    return shared.incomingMessage || "";
  }
  async exec(msg: string): Promise<string> {
    return await callLlm(msg);
  }
  async post(shared: SharedStore, _: string, resp: string): Promise<string> {
    shared.aiResponse = resp;
    return "default";
  }
}