export type AuthResult = { ok: true } | { ok: false; error: string };

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Email is required.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value)) return "Please enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a special character.";
  return null;
}

export function validateMobile(mobile: string): string | null {
  const digits = mobile.replace(/\D/g, "");
  if (!digits) return "Mobile number is required.";
  if (digits.length !== 10) return "Enter a valid 10-digit mobile number.";
  if (!/^[6-9]/.test(digits)) return "Mobile number must start with 6-9.";
  return null;
}
