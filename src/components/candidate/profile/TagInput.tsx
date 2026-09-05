"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

interface TagInputProps {
  label: string;
  placeholder?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagInput({
  label,
  placeholder = "Type and press Enter...",
  tags = [],
  onChange,
  disabled,
}: TagInputProps) {
  const [inputVal, setInputVal] = useState("");

  const handleAdd = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputVal("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !inputVal.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>Add</span>
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                disabled={disabled}
                className="rounded-full p-0.5 hover:bg-primary/20 cursor-pointer text-primary"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
