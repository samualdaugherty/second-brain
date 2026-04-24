export type MessageRole = "user" | "gary";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: "sending" | "complete" | "error";
}

export type ConnectionStatus = "checking" | "online" | "offline";
