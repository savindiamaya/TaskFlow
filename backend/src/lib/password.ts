export const PASSWORD_RULES_MESSAGE =
  "Password must be more than 8 characters and include uppercase, lowercase, a number, and a symbol";

export function validatePassword(password: string): string | null {
  if (password.length <= 8) {
    return "Password must be more than 8 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one capital letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one symbol";
  }
  return null;
}

export const passwordSchema = {
  min: 9,
  message: PASSWORD_RULES_MESSAGE,
};
