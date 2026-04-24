"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function InputBar({ onSend, disabled = false }: InputBarProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTranscript = useCallback((text: string) => {
    setValue((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const { isRecording, isSupported, toggle: toggleVoice } = useVoiceInput({
    onTranscript: handleTranscript,
  });

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      className="border-t pb-safe"
      style={{
        background: "var(--gary-bg)",
        borderColor: "var(--gary-border)",
      }}
    >
      <div className="flex items-end gap-2 px-3 py-3">
        {isSupported && (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={disabled}
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-colors disabled:opacity-40"
            style={
              isRecording
                ? {
                    background: "color-mix(in srgb, var(--gary-accent) 20%, transparent)",
                    color: "var(--gary-accent)",
                    border: "1px solid var(--gary-accent)",
                  }
                : {
                    background: "transparent",
                    color: "var(--gary-text-muted)",
                    border: "1px solid var(--gary-border)",
                  }
            }
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          aria-label="Message Gary"
          placeholder={
            isRecording ? "Listening…" : disabled ? "Gary is thinking…" : "Ask Gary anything…"
          }
          className="flex-1 resize-none rounded-2xl px-4 py-2 text-sm outline-none transition-colors disabled:opacity-60"
          style={{
            background: "var(--gary-surface)",
            color: "var(--gary-text)",
            border: "1px solid var(--gary-border)",
            caretColor: "var(--gary-accent)",
            minHeight: "38px",
            maxHeight: "160px",
            lineHeight: "1.5",
          }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-all disabled:opacity-30"
          style={{
            background: canSend ? "var(--gary-accent)" : "var(--gary-surface)",
            color: canSend ? "var(--gary-bg)" : "var(--gary-text-muted)",
            border: "1px solid var(--gary-border)",
          }}
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
