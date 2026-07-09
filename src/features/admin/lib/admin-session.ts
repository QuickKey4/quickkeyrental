const STORAGE_KEY = "quickkey_admin_secret";

export function getAdminSecret(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setAdminSecret(secret: string): void {
  sessionStorage.setItem(STORAGE_KEY, secret);
}

export function clearAdminSecret(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function hasAdminSecret(): boolean {
  return Boolean(getAdminSecret());
}
