"use client";

import { useEffect, useRef } from "react";
import { Message as MessageType } from "@/lib/types";
import { Message } from "./Message";

interface ChatThreadProps {
  messages: MessageType[];
}

export function ChatThread({ messages }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-end justify-start px-4 pb-6">
        <p className="text-sm" style={{ color: "var(--gary-text-muted)" }}>
          Hey. What do you want to remember?
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
