"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export type VoiceRecorderStatus =
  | "idle"
  | "requesting-permission"
  | "permission-denied"
  | "recording"
  | "recorded";

export function useVoiceRecorder() {
  const [status, setStatus] = useState<VoiceRecorderStatus>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    cleanupStream();
    clearTimer();
    setAudioBlob(null);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setStatus("requesting-permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(finalBlob);
        setStatus("recorded");
        cleanupStream();
        clearTimer();
      };

      mediaRecorder.start(250); // collect in 250ms chunks
      setStatus("recording");

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      cleanupStream();
      clearTimer();
      setStatus("permission-denied");
      setErrorMessage(err.message || "Microphone access was denied or is unavailable.");
    }
  }, [cleanupStream, clearTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
    clearTimer();
    setAudioBlob(null);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setStatus("idle");
  }, [cleanupStream, clearTimer]);

  useEffect(() => {
    return () => {
      cleanupStream();
      clearTimer();
    };
  }, [cleanupStream, clearTimer]);

  return {
    status,
    audioBlob,
    elapsedSeconds,
    errorMessage,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
