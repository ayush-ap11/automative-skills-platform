"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, X } from "lucide-react";

interface FileDropzoneProps {
  file: File | null;
  onFileSelect: (f: File | null) => void;
  disabled?: boolean;
  onError: (msg: string | null) => void;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".docx", ".doc"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function FileDropzone({ file, onFileSelect, disabled = false, onError }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndSet(candidate: File) {
    onError(null);
    const ext = "." + candidate.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      onError("Invalid file format. Please choose a PDF, JPG, PNG, or DOCX file.");
      return;
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      onError("File exceeds maximum allowed size of 10MB.");
      return;
    }
    onFileSelect(candidate);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files?.[0]) validateAndSet(e.dataTransfer.files[0]);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.[0]) validateAndSet(e.target.files[0]);
        }}
      />
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            disabled
              ? "cursor-not-allowed opacity-50 bg-muted/30 border-border"
              : isDragging
              ? "cursor-pointer border-primary bg-primary/5"
              : "cursor-pointer border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">
            Drag & drop your file here, or{" "}
            <span className="text-primary underline">browse files</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, JPG, PNG, or DOCX — max 10MB
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onFileSelect(null)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            title="Remove selected file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
