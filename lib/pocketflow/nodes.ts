// nodes.ts
import { Flow, Node } from "pocketflow";
import { SharedStore } from "./types";
import { sendWhatsAppMessage } from "../twilio";
import { openai } from "@ai-sdk/openai";
import { emailRe, extractEmail, noRe, pickBestEmail, userInfo, yesRe } from "../utils";
import { isValidUniversityEmail, getEmailValidationError } from "../email-utils";
import { fetchCandidateEmails, getUserIdByEmail, linkPhoneToProfile, createUnauthenticatedSession, getUnauthenticatedSession, updateUnauthenticatedSession, linkSessionToUser } from "../supabase/queries";
import { DEFAULT_SYSTEM_PROMPT, PERSONALIZED_SYSTEM_PROMPT } from "../prompts";
import { clubRecommendationTool, extractUserInfoAndConnectionsTool, personRecommendationTool, sendWarmIntroTool } from "./tools";
import { generateText, stepCountIs } from "ai";
// import { handleClubRecommendations } from "./utils"; // replaced by tool-enabled single chat

// Simple, consistent logger for this module
const log = (
  node: string,
  step: string,
  data?: Record<string, unknown>
) => {
  try {
    // Use debug so it can be filtered in prod
    console.debug(`[${node}] ${step}`, data ?? {});
  } catch (e) {
    // Fallback if serialization fails for any reason
    console.debug(`[${node}] ${step} (logging_failed)`, String(e));
  }
};

const truncate = (s: string, max = 200) =>
  typeof s === "string" && s.length > max ? `${s.slice(0, max)}…` : s;

// New node to handle first message and request email
export class FirstMessageNode extends Node<SharedStore> {
  async prep(shared: SharedStore): Promise<{
    sessionExists: boolean;
    isFirstMessage: boolean;
    message: string;
  }> {
    const sessionId = shared.sessionId || shared.user?.phone || "";
    const session = await getUnauthenticatedSession(sessionId);
    const message = shared.incomingMessage || "";
    
    log("FirstMessageNode", "prep", {
      sessionId,
      sessionExists: !!session,
      messagePreview: truncate(message, 120),
      hasEmailRequested: !!session?.email_requested_at,
    });
    
    return {
      sessionExists: !!session,
      isFirstMessage: !session || !session.email_requested_at,
      message,
    };
  }

  async exec({ sessionExists, isFirstMessage, message }: {
    sessionExists: boolean;
    isFirstMessage: boolean;
    message: string;
  }): Promise<"respond_and_ask_email" | "parse_email" | "chat"> {
    log("FirstMessageNode", "exec", {
      sessionExists,
      isFirstMessage,
      messagePreview: truncate(message, 120),
    });

    if (isFirstMessage) {
      return "respond_and_ask_email";
    } else if (emailRe.test(message) || yesRe.test(message)) {
      return "parse_email";
    } else {
      return "chat";
    }
  }

  async post(shared: SharedStore, _: unknown, action: "respond_and_ask_email" | "parse_email" | "chat"): Promise<string> {
    log("FirstMessageNode", "post", { action });
    
    if (action === "respond_and_ask_email") {
      const sessionId = shared.sessionId || shared.user?.phone || "";
      const message = shared.incomingMessage || "";
      
      // Create or update session
      try {
        await createUnauthenticatedSession(sessionId, {
          phoneNumber: shared.user?.phone,
          firstName: shared.user?.firstName,
          lastName: shared.user?.lastName,
          profileName: `${shared.user?.firstName || ""} ${shared.user?.lastName || ""}`.trim(),
          firstMessage: message,
        });
      } catch (error) {
        // Session might already exist, update it
        await updateUnauthenticatedSession(sessionId, {
          emailRequestedAt: new Date().toISOString(),
        });
      }
      
      // Respond to their message and ask for email
      shared.aiResponse = `Thanks for reaching out! I'd love to help you connect with people on campus. 

To get started, I'll need to confirm your university email address. What's your email?`;
      shared.hasRequestedEmail = true;
      shared.awaitingEmail = true;
    }
    
    return action;
  }
}

export class CheckConfirmationNode extends Node<SharedStore> {
  async prep(shared: SharedStore): Promise<{
    confirmed: boolean;
    msg: string;
    awaiting: boolean;
  }> {
    log("CheckConfirmationNode", "prep:start", {
      confirmationCompleted: !!shared.confirmationCompleted,
      incomingMessageLen: (shared.incomingMessage || "").length,
      awaitingEmail: !!shared.awaitingEmail,
    });
    const res = {
      confirmed: !!shared.confirmationCompleted,
      msg: (shared.incomingMessage || "").trim(),
      awaiting: !!shared.awaitingEmail,
    };
    log("CheckConfirmationNode", "prep:done", {
      confirmed: res.confirmed,
      msgPreview: truncate(res.msg, 120),
      awaiting: res.awaiting,
    });
    return res;
  }

  async exec({ confirmed, msg, awaiting }: { confirmed: boolean; msg: string; awaiting: boolean }): Promise<"confirmed" | "parse" | "ask"> {
    log("CheckConfirmationNode", "exec:start", {
      confirmed,
      awaiting,
      msgPreview: truncate(msg, 120),
      hasEmail: emailRe.test(msg),
      hasYes: yesRe.test(msg),
    });
    if (confirmed) {
      log("CheckConfirmationNode", "exec:decision", { action: "confirmed" });
      return "confirmed";
    }
    if (emailRe.test(msg) || yesRe.test(msg) || awaiting) {
      log("CheckConfirmationNode", "exec:decision", { action: "parse" });
      return "parse";
    }
    log("CheckConfirmationNode", "exec:decision", { action: "ask" });
    return "ask";
  }

  async post(_: SharedStore, __: unknown, action: "confirmed" | "parse" | "ask"): Promise<string> {
    log("CheckConfirmationNode", "post", { action });
    return action;
  }
}

// Ask user to confirm or provide email; optionally suggest best guess
export class AskForEmailNode extends Node<SharedStore> {
  async prep(shared: SharedStore): Promise<{ firstName?: string }> {
    const res = { firstName: shared.user?.firstName };
    log("AskForEmailNode", "prep", { firstName: res.firstName });
    return res;
  }

  async exec({ firstName }: { firstName?: string }): Promise<{ suggestion?: string }> {
    log("AskForEmailNode", "exec:start", { firstName });
    if (!firstName) {
      log("AskForEmailNode", "exec:decision", { suggestion: undefined });
      return { suggestion: undefined };
    }
    const candidates = await fetchCandidateEmails(firstName);
    log("AskForEmailNode", "exec:candidates", {
      firstName,
      count: Array.isArray(candidates) ? candidates.length : undefined,
    });
    const best = pickBestEmail(firstName, candidates);
    log("AskForEmailNode", "exec:best", { best });
    return { suggestion: best || undefined };
  }

  async post(shared: SharedStore, _: unknown, { suggestion }: { suggestion?: string }): Promise<string> {
    log("AskForEmailNode", "post:start", { suggestion });
    shared.suggestedEmail = suggestion;
    shared.awaitingEmail = true;

    if (suggestion) {
      shared.aiResponse = `To continue, confirm your email. Is it ${suggestion}? Reply 'y' to confirm or send the correct email.`;
    } else {
      shared.aiResponse = `To continue, send your email address.`;
    }
    log("AskForEmailNode", "post:done", {
      awaitingEmail: shared.awaitingEmail,
      suggestedEmail: shared.suggestedEmail,
      aiResponsePreview: truncate(shared.aiResponse || "", 160),
    });
    return "await_reply"; // flow ends until next inbound message
  }
}

// Parse reply: yes -> accept suggestion; or extract an explicit email
export class ParseEmailOrConfirmationNode extends Node<SharedStore> {
  async prep(shared: SharedStore): Promise<{ msg: string; suggestion?: string }> {
    const res = { msg: (shared.incomingMessage || "").trim(), suggestion: shared.suggestedEmail };
    log("ParseEmailOrConfirmationNode", "prep", {
      msgPreview: truncate(res.msg, 160),
      suggestion: res.suggestion,
    });
    return res;
  }

  async exec({ msg, suggestion }: { msg: string; suggestion?: string }): Promise<{ action: "got_email" | "ask_again"; email?: string; validationError?: string }> {
    log("ParseEmailOrConfirmationNode", "exec:start", {
      msgPreview: truncate(msg, 160),
      suggestion,
      hasYes: yesRe.test(msg),
      hasNo: noRe.test(msg),
      hasEmail: emailRe.test(msg),
    });
    
    if (yesRe.test(msg) && suggestion) {
      // Validate the suggested email with university-specific validation
      const validationError = getEmailValidationError(suggestion);
      if (validationError) {
        log("ParseEmailOrConfirmationNode", "exec:decision", { action: "ask_again", source: "invalid_suggestion", validationError });
        return { action: "ask_again", validationError };
      }
      log("ParseEmailOrConfirmationNode", "exec:decision", { action: "got_email", source: "yes+suggestion" });
      return { action: "got_email", email: suggestion };
    }
    
    if (noRe.test(msg)) {
      log("ParseEmailOrConfirmationNode", "exec:decision", { action: "ask_again", source: "no" });
      return { action: "ask_again" };
    }

    const email = extractEmail(msg);
    if (email) {
      // Validate extracted email with university-specific validation
      const validationError = getEmailValidationError(email);
      if (validationError) {
        log("ParseEmailOrConfirmationNode", "exec:decision", { action: "ask_again", source: "invalid_email", validationError });
        return { action: "ask_again", validationError };
      }
      log("ParseEmailOrConfirmationNode", "exec:decision", { action: "got_email", source: "extracted", email });
      return { action: "got_email", email };
    }

    log("ParseEmailOrConfirmationNode", "exec:decision", { action: "ask_again", source: "fallback" });
    return { action: "ask_again" };
  }

  async post(shared: SharedStore, _: unknown, res: { action: "got_email" | "ask_again"; email?: string; validationError?: string }): Promise<string> {
    log("ParseEmailOrConfirmationNode", "post:start", res);
    if (res.action === "got_email" && res.email) {
      shared.user.email = res.email;
      log("ParseEmailOrConfirmationNode", "post:got_email", { email: res.email });
      return "got_email";
    }

    // Use specific validation error message if available
    shared.aiResponse = res.validationError || `Please send a valid university email address.`;
    shared.awaitingEmail = true;
    log("ParseEmailOrConfirmationNode", "post:ask_again", {
      awaitingEmail: shared.awaitingEmail,
      validationError: res.validationError,
      aiResponsePreview: truncate(shared.aiResponse || "", 160),
    });
    return "ask_again";
  }
}

// Verify email exists and link phone; then mark confirmation complete
export class VerifyAndLinkNode extends Node<SharedStore> {
  async prep(shared: SharedStore): Promise<{ email?: string; phone?: string; sessionId?: string }> {
    const res = { 
      email: shared.user?.email, 
      phone: shared.user?.phone,
      sessionId: shared.sessionId || shared.user?.phone || ""
    };
    log("VerifyAndLinkNode", "prep", { email: res.email, phone: res.phone, sessionId: res.sessionId });
    return res;
  }

  async exec({ email, phone, sessionId }: { email?: string; phone?: string; sessionId?: string }): Promise<{ ok: boolean; reason?: string; userId?: string }> {
    log("VerifyAndLinkNode", "exec:start", { email, phone, sessionId });
    if (!email || !phone || !sessionId) {
      log("VerifyAndLinkNode", "exec:decision", { ok: false, reason: "missing" });
      return { ok: false, reason: "missing" };
    }

    // Use the new linkSessionToUser function
    const userId = await linkSessionToUser(sessionId, email, phone);
    log("VerifyAndLinkNode", "exec:lookup", { email, phone, sessionId, userId });
    
    if (!userId) {
      log("VerifyAndLinkNode", "exec:decision", { ok: false, reason: "not_found" });
      return { ok: false, reason: "not_found" };
    }
    
    log("VerifyAndLinkNode", "exec:linked", { email, phone, sessionId, userId });
    return { ok: true, userId };
  }

  async post(shared: SharedStore, _: unknown, res: { ok: boolean; reason?: string; userId?: string }): Promise<string> {
    log("VerifyAndLinkNode", "post:start", res);
    if (res.ok) {
      shared.confirmationCompleted = true;
      shared.awaitingEmail = false;
      shared.aiResponse = "Perfect! Your account has been successfully linked. Now, what can I help you with? I can help you find friends, clubs, study groups, or even potential dates on campus!";
      log("VerifyAndLinkNode", "post:confirmed", {
        confirmationCompleted: shared.confirmationCompleted,
        awaitingEmail: shared.awaitingEmail,
        aiResponsePreview: truncate(shared.aiResponse || "", 160),
      });
      return "confirmed";
    }

    if (res.reason === "not_found") {
      shared.aiResponse = `That email is not recognized in our system. Please make sure you're using your university email address and try again.`;
    } else {
      shared.aiResponse = `Please provide your university email address to continue.`;
    }
    shared.awaitingEmail = true;
    log("VerifyAndLinkNode", "post:ask_again", {
      reason: res.reason,
      awaitingEmail: shared.awaitingEmail,
      aiResponsePreview: truncate(shared.aiResponse || "", 160),
    });
    return "ask_again";
  }
}

// Open chat with the AI once confirmed
export class ChatNode extends Node<SharedStore> {
  async prep(shared: SharedStore): Promise<SharedStore> {
    const msg = shared.incomingMessage || "";
    shared.messages.push({ role: "user", content: msg });
    log("ChatNode", "prep", { msgPreview: truncate(msg, 200), length: msg.length });
    return shared;
  }

  async exec(shared: SharedStore): Promise<string> {
    const userMsg = shared.messages.at(-1)?.content as string;
    if (!userMsg) {
      throw new Error("No user message found");
    }

    log("ChatNode", "exec:send", { msgPreview: truncate(userMsg, 200), length: userMsg.length });

    // Generate main response with tool-enabled chat (searchClubs)
    const personalizedSystemPrompt = PERSONALIZED_SYSTEM_PROMPT(shared);
    const { text, toolCalls } = await generateText({
      model: openai('gpt-4o'),
      temperature: 0,
      system: personalizedSystemPrompt,
      messages: shared.messages.slice(-7),
      tools: {
        searchClubs: clubRecommendationTool,
        extractUserInfoAndConnections: extractUserInfoAndConnectionsTool,
        searchPeople: personRecommendationTool,
        sendWarmIntro: sendWarmIntroTool,
      },
      stopWhen: stepCountIs(5)
    });

    log("ChatNode", "exec:reply", {
      replyPreview: truncate(text, 200),
      length: text.length,
      toolCalls: toolCalls.length,
    });

    return text;
  }

  async post(shared: SharedStore, _: string, reply: string): Promise<string | undefined> {
    shared.aiResponse = reply;
    shared.messages.push({ role: "assistant", content: reply });
    log("ChatNode", "post", { aiResponsePreview: truncate(reply, 200), length: reply.length });
    return undefined; // end
  }
}
