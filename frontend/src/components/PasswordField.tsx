"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { getPasswordChecks, PASSWORD_HINT } from "@/lib/password";

export function PasswordField({
  value,
  onChange,
  label = "Password",
  showRules = false,
  required = true,
  name = "password",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  showRules?: boolean;
  required?: boolean;
  name?: string;
}) {
  const [visible, setVisible] = useState(false);
  const checks = getPasswordChecks(value);

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          className="field"
          style={{ paddingRight: "2.75rem" }}
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={name === "password" ? "current-password" : "new-password"}
        />
        <button
          type="button"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5"
          style={{ color: "var(--ink-muted)", background: "transparent", border: 0, cursor: "pointer" }}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {showRules && (
        <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--ink-muted)" }}>
          <p>{PASSWORD_HINT}</p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {[
              ["length", "> 8 characters", checks.length],
              ["upper", "Capital letter", checks.upper],
              ["lower", "Lowercase letter", checks.lower],
              ["number", "Number", checks.number],
              ["symbol", "Symbol", checks.symbol],
            ].map(([key, text, ok]) => (
              <li key={String(key)} style={{ color: ok ? "var(--ok)" : "var(--ink-muted)" }}>
                {ok ? "✓" : "○"} {text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
