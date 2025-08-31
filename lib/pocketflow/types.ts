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
  // internal, ephemeral
  suggestedEmail?: string;
  awaitingEmail?: boolean;
}