export type FieldErrors = Record<string, string>;

export const isValidEmail = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

export const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;

export const firstErrorMessage = (errors: FieldErrors) => Object.values(errors)[0] ?? '';

export const required = (value: string, message: string) => (value.trim() ? '' : message);
