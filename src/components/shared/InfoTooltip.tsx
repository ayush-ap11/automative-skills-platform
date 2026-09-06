"use client";

import { HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="More information"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground transition-colors cursor-help focus:outline-none"
      >
        <HelpCircle className="size-3.5" />
      </button>

      {open && (
        <div
          role="tooltip"
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-lg border border-border bg-popover p-2.5 text-[11px] font-normal normal-case leading-relaxed text-popover-foreground shadow-md pointer-events-auto"
        >
          {text}
          <div className="absolute top-full left-2 -mt-px border-4 border-transparent border-t-popover" />
        </div>
      )}
    </div>
  );
}
