import { Node } from "pocketflow";
import { SharedStore } from "./types";
import { fetchCandidateEmails, getUserIdByEmail, linkPhoneToProfile } from "../supabase/queries";
import { sendWhatsAppMessage } from "../twilio";
import { callLlm } from "../llm";
import { pickBestEmail } from "../utils";

export class ResolveEmailNode extends Node<SharedStore> {
  async prep(s: SharedStore): Promise<string> { return s.user.firstName || ""; }
  async exec(firstName: string): Promise<string | null> {
    const candidates = await fetchCandidateEmails(firstName);
    return pickBestEmail(firstName, candidates);
  }
  async post(s: SharedStore, _: string, email: string | null): Promise<string> {
    if (!email) return "needs_confirmation";
    s.user.email = email;
    return "needs_confirmation";
  }
}

export class ConfirmEmailNode extends Node<SharedStore> {
  async prep(s: SharedStore): Promise<[string, string]> {
    return [s.user.phone || "", s.user.email || ""];
  }
  async exec([phone, email]: [string, string]): Promise<string> {
    const msg = `We found your email as ${email}. Reply YES to confirm, or NO to correct.`;
    await sendWhatsAppMessage(phone, msg);
    return email;
  }
  async post(s: SharedStore): Promise<string> {
    s.confirmationSent = true;
    s.confirmationPending = true;   // enter waiting state
    return "await_confirmation";
  }
}

// NEW: waits for the next inbound message and interprets it
export class AwaitConfirmationNode extends Node<SharedStore> {
  async prep(s: SharedStore): Promise<[string | undefined, string | undefined, boolean | undefined]> {
    return [s.incomingMessage, s.user.email, s.confirmationPending];
  }
  async exec([msg, email, pending]: [string | undefined, string | undefined, boolean | undefined]): Promise<"confirmed" | "rejected" | "ignore"> {
    if (!pending || !msg) return "ignore";
    const norm = msg.trim().toLowerCase();
    if (["yes", "y", "confirm", "ok"].includes(norm)) return "confirmed";
    if (["no", "n", "nope", "incorrect"].includes(norm)) return "rejected";
    return "ignore"; // keep waiting until clear signal
  }
  async post(s: SharedStore, _: unknown, status: "confirmed" | "rejected" | "ignore"): Promise<string> {
    if (status === "ignore") return "await_confirmation"; // re-enter this node
    if (status === "rejected") {
      s.confirmationPending = false;
      s.user.email = undefined;
      return "needs_resolution"; // send back to ResolveEmailNode or a “collect email” node
    }
    // confirmed
    s.confirmationPending = false;
    return "bind_identity";
  }
}

// NEW: after confirmation, bind phone to the user profile owning that email
export class BindIdentityNode extends Node<SharedStore> {
  async prep(s: SharedStore): Promise<[string | undefined, string | undefined]> {
    return [s.user.email, s.user.phone];
  }
  async exec([email, phone]: [string | undefined, string | undefined]): Promise<"bound" | "missing_data"> {
    if (!email || !phone) return "missing_data";
    const userId = await getUserIdByEmail(email);
    if (!userId) return "missing_data";
    await linkPhoneToProfile(userId, phone);
    return "bound";
  }
  async post(s: SharedStore, _: unknown, r: "bound" | "missing_data"): Promise<string> {
    return r === "bound" ? "default" : "error";
  }
}

export class GenerateResponseNode extends Node<SharedStore> {
  async prep(s: SharedStore): Promise<string> { return s.incomingMessage || ""; }
  async exec(msg: string): Promise<string> { return await callLlm(msg); }
  async post(s: SharedStore, _: string, resp: string): Promise<string> {
    s.aiResponse = resp;
    return "default";
  }
}
