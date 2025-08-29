export interface SharedStore {
  user: {
    phone?: string;
    firstName?: string;
    email?: string;
    profileId?: string;
  };
  incomingMessage?: string;
  aiResponse?: string;
  confirmationSent?: boolean;
}