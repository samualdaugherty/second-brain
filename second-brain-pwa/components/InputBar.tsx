"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Send, Mic, MicOff, Paperclip, X } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

export interface AttachedImage {
  base64: string;
  mimeType: string;
  previewUrl: string;
  fileName: string;
}

interface InputBarProps {
  onSend: (message: string, image?: AttachedImage) => void;
  disabled?: boolean;
}

export function InputBar({ onSend, disabled = false }: InputBarProps) {
  const [value, setValue] = useState("");
  const [image, setImage] = useState<AttachedImage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
      setImage({
        base64,
        mimeType,
        previewUrl: dataUrl,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const removeImage = useCallback(() => {
    setImage(null);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && !image) || disabled) return;
    onSend(trimmed || "What is this?", image ?? undefined);
    setValue("");
    setImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, image, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = (value.trim().length > 0 || image !== null) && !disabled;

  return (
    <div
      className="border-t pb-safe"
      style={{
        background: "var(--gary-bg)",
        borderColor: "var(--gary-border)",
      }}
    >
      {/* Image preview strip */}
      {image && (
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="relative flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.previewUrl}
              alt="Attached"
              className="w-16 h-16 object-cover rounded-xl"
              style={{ border: "1px solid var(--gary-border)" }}
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: "var(--gary-text-muted)",
                color: "var(--gary-bg)",
              }}
              aria-label="Remove image"
            >
              <X size={11} />
            </button>
          </div>
          <span
            className="text-xs truncate max-w-[180px]"
            style={{ color: "var(--gary-text-muted)" }}
          >
            {image.fileName}
          </span>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-3">
        {/* Hidden file input — accept any image, lets iOS show native sheet */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-colors disabled:opacity-40"
          style={{
            background: image ? "color-mix(in srgb, var(--gary-accent) 20%, transparent)" : "transparent",
            color: image ? "var(--gary-accent)" : "var(--gary-text-muted)",
            border: "1px solid var(--gary-border)",
          }}
          aria-label="Attach image"
        >
          <Paperclip size={16} />
        </button>

        {/* Mic button */}
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
            isRecording
              ? "Listening…"
              : disabled
              ? "Gary is thinking…"
              : image
              ? "Add a note about this image…"
              : "Ask Gary anything…"
          }
          className="flex-1 resize-none rounded-2xl px-4 py-2 text-base sm:text-sm outline-none transition-colors disabled:opacity-60"
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
