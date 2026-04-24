"use client";

const STORAGE_KEY = "gary-chat-session-id";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateChatSessionId(): string {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const next = createSessionId();
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}
