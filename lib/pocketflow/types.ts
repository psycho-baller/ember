import { ModelMessage } from "ai";

export interface SharedStore {
  user: {
    phone?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  incomingMessage?: string;
  aiResponse?: string;
  confirmationCompleted?: boolean;
  suggestedEmail?: string;
  awaitingEmail?: boolean;
  messages: ModelMessage[];
}