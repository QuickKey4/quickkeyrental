import { createHash } from "node:crypto";

import { getRequestIP } from "@tanstack/react-start/server";

export function checkoutRequestFingerprint(checkoutSessionId: string): string {
  const requestIp = getRequestIP({ xForwardedFor: true });
  const source = requestIp ? `ip:${requestIp}` : `session:${checkoutSessionId}`;
  return createHash("sha256").update(source).digest("hex");
}
