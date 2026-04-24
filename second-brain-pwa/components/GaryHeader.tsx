"use client";

import { ConnectionStatus } from "@/lib/types";
import { StatusIndicator } from "./StatusIndicator";
import { LogOut } from "lucide-react";

interface GaryHeaderProps {
  connectionStatus: ConnectionStatus;
  onSignOut: () => void;
  isSigningOut?: boolean;
}

export function GaryHeader({
  connectionStatus,
  onSignOut,
  isSigningOut = false,
}: GaryHeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b pt-safe"
      style={{
        background: "var(--gary-bg)",
        borderColor: "var(--gary-border)",
      }}
    >
      <div className="flex items-baseline gap-2">
        <h1
          className="text-lg font-semibold tracking-tight"
          style={{ color: "var(--gary-accent)" }}
        >
          Gary
        </h1>
        <span
          className="text-xs font-normal"
          style={{ color: "var(--gary-text-muted)" }}
        >
          second brain
        </span>
      </div>
      <div className="flex items-center gap-3">
        <StatusIndicator status={connectionStatus} />
        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs disabled:opacity-60"
          style={{
            borderColor: "var(--gary-border)",
            color: "var(--gary-text-muted)",
          }}
          aria-label="Sign out"
        >
          <LogOut size={12} />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </header>
  );
}
