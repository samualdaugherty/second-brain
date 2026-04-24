"use client";

import { useState, useCallback } from "react";
import { Message } from "@/lib/types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
      status: "complete",
    };

    const garyMessageId = generateId();
    const garyMessage: Message = {
      id: garyMessageId,
      role: "gary",
      content: "",
      timestamp: new Date(),
      status: "sending",
    };

    setMessages((prev) => [...prev, userMessage, garyMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const raw = line.slice("data:".length).trim();
            if (!raw) continue;

            let event: {
              text?: string;
              error?: string;
              done?: boolean;
            };

            try {
              event = JSON.parse(raw) as {
                text?: string;
                error?: string;
                done?: boolean;
              };
            } catch {
              // Malformed JSON in SSE — skip
              continue;
            }

            if (event.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === garyMessageId ? { ...m, status: "complete" } : m
                )
              );
              setIsLoading(false);
              return;
            }

            if (event.error) {
              throw new Error(event.error);
            }

            if (event.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === garyMessageId
                    ? { ...m, content: m.content + event.text }
                    : m
                )
              );
            }
          }
        }
      }

      // Stream ended without a done event — mark complete anyway
      setMessages((prev) =>
        prev.map((m) =>
          m.id === garyMessageId ? { ...m, status: "complete" } : m
        )
      );
    } catch (err) {
      const isNetworkError =
        err instanceof TypeError && err.message.includes("fetch");
      const errorText = isNetworkError
        ? "Can't reach the Mac Mini right now. Make sure Tailscale is running."
        : "Something went wrong. Try again.";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === garyMessageId
            ? { ...m, content: errorText, status: "error" }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return { messages, isLoading, sendMessage };
}
