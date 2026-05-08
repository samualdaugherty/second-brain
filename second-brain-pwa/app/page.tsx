"use client";

import { useEffect, useState } from "react";
import { GaryHeader } from "@/components/GaryHeader";
import { ChatThread } from "@/components/ChatThread";
import { InputBar } from "@/components/InputBar";
import { useChat } from "@/hooks/useChat";
import { ConnectionStatus, Message } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function Home() {
  const { messages, isLoading, sendMessage } = useChat();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BRIDGE_URL}/health`,
          { headers: { "x-api-key": process.env.NEXT_PUBLIC_BRIDGE_API_KEY ?? "" } }
        );
        if (cancelled) return;
        if (res.ok) {
          setConnectionStatus("online");
        } else {
          setConnectionStatus("offline");
        }
      } catch {
        if (!cancelled) setConnectionStatus("offline");
      }
    }

    checkHealth();

    // Re-check every 60 seconds
    const interval = setInterval(checkHealth, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Inject offline notice into thread once, when bridge is unreachable
  const messagesWithOfflineNotice: Message[] = (() => {
    if (connectionStatus !== "offline" || messages.length > 0) return messages;
    return [
      {
        id: "offline-notice",
        role: "gary",
        content:
          "Gary's home base isn't reachable right now. Make sure Tailscale is running.",
        timestamp: new Date(),
        status: "complete",
      },
    ];
  })();

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--gary-bg)" }}
    >
      <GaryHeader
        connectionStatus={connectionStatus}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />
      <ChatThread messages={messagesWithOfflineNotice} />
      <InputBar onSend={(msg, img) => sendMessage(msg, img)} disabled={isLoading} />
    </div>
  );
}
