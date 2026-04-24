"use client";

import { ConnectionStatus } from "@/lib/types";

interface StatusIndicatorProps {
  status: ConnectionStatus;
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { color: string; label: string; pulse: boolean }
> = {
  checking: {
    color: "bg-[#c9933a]",
    label: "Checking…",
    pulse: true,
  },
  online: {
    color: "bg-[#5a9e6f]",
    label: "Online",
    pulse: false,
  },
  offline: {
    color: "bg-[#c94a3a]",
    label: "Unreachable",
    pulse: false,
  },
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const { color, label, pulse } = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-1.5" title={label}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-75 animate-ping`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
      </span>
      <span className="text-xs" style={{ color: "var(--gary-text-muted)" }}>
        {label}
      </span>
    </div>
  );
}
