export const PASSWORD_HINT =
  "More than 8 characters, with uppercase, lowercase, a number, and a symbol.";

export function getPasswordChecks(password: string) {
  return {
    length: password.length > 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordValid(password: string) {
  const c = getPasswordChecks(password);
  return c.length && c.upper && c.lower && c.number && c.symbol;
}

export function passwordError(password: string): string | null {
  const c = getPasswordChecks(password);
  if (!c.length) return "Password must be more than 8 characters";
  if (!c.upper) return "Include at least one capital letter";
  if (!c.lower) return "Include at least one lowercase letter";
  if (!c.number) return "Include at least one number";
  if (!c.symbol) return "Include at least one symbol";
  return null;
}
