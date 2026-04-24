"use client";

import { Message as MessageType } from "@/lib/types";
import ReactMarkdown from "react-markdown";

interface MessageProps {
  message: MessageType;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 h-4">
      <span
        className="inline-block w-1 h-1 rounded-full dot-1"
        style={{ background: "var(--gary-text-muted)" }}
      />
      <span
        className="inline-block w-1 h-1 rounded-full dot-2"
        style={{ background: "var(--gary-text-muted)" }}
      />
      <span
        className="inline-block w-1 h-1 rounded-full dot-3"
        style={{ background: "var(--gary-text-muted)" }}
      />
    </span>
  );
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const isSending = message.status === "sending" && message.content === "";

  return (
    <div
      className={`message-enter flex flex-col gap-1 ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm"
            : "rounded-bl-sm"
        }`}
        style={
          isUser
            ? {
                background: "var(--gary-user-bubble)",
                color: "var(--gary-text)",
                border: "1px solid var(--gary-border)",
              }
            : isError
            ? {
                background: "var(--gary-gary-bubble)",
                color: "var(--gary-error)",
                border: "1px solid color-mix(in srgb, var(--gary-error) 30%, transparent)",
              }
            : {
                background: "var(--gary-gary-bubble)",
                color: "var(--gary-text)",
                border: "1px solid var(--gary-border)",
              }
        }
      >
        {isSending ? (
          <TypingDots />
        ) : isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="gary-prose">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {message.status === "sending" && message.content && (
              <span className="inline-block ml-1">
                <TypingDots />
              </span>
            )}
          </div>
        )}
      </div>
      <time
        className="text-xs px-1"
        style={{ color: "var(--gary-text-muted)" }}
        dateTime={message.timestamp.toISOString()}
      >
        {formatTime(message.timestamp)}
      </time>
    </div>
  );
}
