import { timingSafeEqual } from "node:crypto";

export function assertAdminSecret(provided: string): void {
  const expected = process.env.QUICKKEY_ADMIN_SECRET;

  if (!expected) {
    throw new Error("Admin portal is not configured. Set QUICKKEY_ADMIN_SECRET.");
  }

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
    throw new Error("Invalid admin password.");
  }
}
