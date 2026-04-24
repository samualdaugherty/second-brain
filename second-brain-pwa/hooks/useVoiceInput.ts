"use client";

import { useState, useRef, useCallback } from "react";

// Extend window type for cross-browser Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const start = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      onError?.("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        onError?.(`Voice error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript, onError]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) {
      stop();
    } else {
      start();
    }
  }, [isRecording, start, stop]);

  return { isRecording, isSupported, toggle, start, stop };
}
