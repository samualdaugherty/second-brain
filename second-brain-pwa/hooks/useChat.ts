"use client";

import { useState, useCallback } from "react";
import { Message } from "@/lib/types";
import { getOrCreateChatSessionId } from "@/lib/chatSession";

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

    const sessionId = getOrCreateChatSessionId();
    const history = messages
      .filter((m) => m.status !== "error")
      .map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      }));

    const controller = new AbortController();
    const OVERALL_TIMEOUT_MS = 180_000;
    const INACTIVITY_TIMEOUT_MS = 45_000;
    let inactivityTimeout: ReturnType<typeof setTimeout> | null = null;
    let overallTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearTimers = () => {
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
      if (overallTimeout) clearTimeout(overallTimeout);
      inactivityTimeout = null;
      overallTimeout = null;
    };

    try {

      const resetInactivityTimer = () => {
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
          controller.abort("INACTIVITY_TIMEOUT");
        }, INACTIVITY_TIMEOUT_MS);
      };

      overallTimeout = setTimeout(() => {
        controller.abort("OVERALL_TIMEOUT");
      }, OVERALL_TIMEOUT_MS);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          history,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let details = `HTTP ${res.status}`;
        try {
          const errBody = (await res.json()) as { error?: string };
          if (errBody?.error) {
            details = errBody.error;
          }
        } catch {
          // Keep fallback details if body is not JSON.
        }
        throw new Error(details);
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let hasVisibleAssistantText = false;
      resetInactivityTimer();

      const finalizeAssistantMessage = (status: "complete" | "error") => {
        clearTimers();
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== garyMessageId) return m;

            if (!hasVisibleAssistantText) {
              return {
                ...m,
                content:
                  "Gary finished processing but returned no visible response. Try again, or split the request into smaller steps.",
                status: "error",
              };
            }

            return { ...m, status };
          })
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resetInactivityTimer();

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
              finalizeAssistantMessage("complete");
              setIsLoading(false);
              return;
            }

            if (event.error) {
              // The bridge may emit this warning before valid output.
              // It is non-fatal and should not fail the whole chat request.
              if (event.error.startsWith("Warning: no stdin data received")) {
                continue;
              }
              throw new Error(event.error);
            }

            if (event.text) {
              hasVisibleAssistantText = hasVisibleAssistantText || event.text.trim().length > 0;
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
      finalizeAssistantMessage("complete");
    } catch (err) {
      const isNetworkError =
        err instanceof TypeError && err.message.includes("fetch");
      const isTimeoutError =
        err instanceof DOMException && err.name === "AbortError";
      const errorText = isNetworkError
        ? "Can't reach the Mac Mini right now. Make sure Tailscale is running."
        : isTimeoutError
        ? "Gary timed out waiting for that action to finish. Try splitting this into smaller steps (for example: save first, then reminder)."
        : err instanceof Error && err.message
        ? err.message
        : "Something went wrong. Try again.";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === garyMessageId
            ? { ...m, content: errorText, status: "error" }
            : m
        )
      );
    } finally {
      clearTimers();
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  return { messages, isLoading, sendMessage };
}
