"use client";

import { Search } from "lucide-react";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search tasks by title or description…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="surface p-4">
      <label className="label">Search</label>
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          style={{ color: "var(--ink-muted)" }}
        />
        <input
          className="field"
          style={{ paddingLeft: "2.5rem" }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Search"
        />
      </div>
    </div>
  );
}
