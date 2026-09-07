export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isOverdue(dueDate?: string | null, status?: string) {
  if (!dueDate || status === "done") return false;
  return new Date(dueDate).getTime() < Date.now();
}

export function isDueSoon(dueDate?: string | null, status?: string) {
  if (!dueDate || status === "done") return false;
  const t = new Date(dueDate).getTime();
  const now = Date.now();
  return t >= now && t <= now + 2 * 86400000;
}
