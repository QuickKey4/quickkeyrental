import { getServerConfig } from "@/lib/config.server";
import { SITE_URL } from "@/lib/site-metadata";

export type SentooTransactionStatus =
  | "issued"
  | "pending"
  | "success"
  | "failed"
  | "cancelled"
  | "expired"
  | string;

type SentooSuccessEnvelope<T> = {
  success: {
    code: number;
    message: string;
    data?: T;
  };
};

type SentooErrorEnvelope = {
  error: {
    code: number;
    message: string;
    reference?: string;
  };
};

export type SentooCreatePaymentResult = {
  transactionId: string;
  url: string;
  qrCode: string;
};

export type SentooStatusResult = {
  status: SentooTransactionStatus;
  data?: Record<string, unknown>;
};

const SENTOO_STATUS_RECHECK_ATTEMPTS = 3;
const SENTOO_STATUS_RECHECK_DELAY_MS = 750;

const SENTOO_TERMINAL_FAILURE_STATUSES = new Set(["cancelled", "expired", "failed", "rejected"]);
const SENTOO_SUCCESS_STATUSES = new Set(["success"]);
const SENTOO_ACTIVE_STATUSES = new Set(["issued", "pending"]);

function getSentooConfig() {
  const config = getServerConfig();
  const apiHost = config.sentooApiHost?.replace(/\/$/, "");
  const merchantId = config.sentooMerchantId;
  const merchantSecret = config.sentooMerchantSecret;
  const currency = config.sentooCurrency ?? "USD";

  if (!apiHost || !merchantId || !merchantSecret) {
    return null;
  }

  const payHost = apiHost.includes("sandbox")
    ? "https://pay.sandbox.sentoo.io"
    : "https://pay.sentoo.io";

  return { apiHost, merchantId, merchantSecret, currency, payHost };
}

export function isSentooConfigured(): boolean {
  return getSentooConfig() !== null;
}

function sentooHeaders(secret: string): HeadersInit {
  return {
    accept: "application/json",
    "X-SENTOO-SECRET": secret,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

function formatSentooError(error: SentooErrorEnvelope["error"], currency: string): string {
  const reference = error.reference ? ` Reference: ${error.reference}.` : "";

  if (error.code === 401) {
    return `Sentoo rejected the merchant secret. Update SENTOO_MERCHANT_SECRET in Vercel with the current secret from the Sentoo merchant portal.${reference}`;
  }

  if (error.code === 402) {
    const apiHost =
      getSentooConfig()?.apiHost ?? process.env.SENTOO_API_HOST ?? "your Sentoo API host";
    const returnBaseUrl = resolveSentooReturnBaseUrl();
    return `Sentoo could not start checkout. In the Sentoo merchant portal, add ${returnBaseUrl} under Valid hostnames (include https://), confirm currency ${currency} is enabled for your merchant, and verify sandbox credentials match ${apiHost}.${reference} Contact support@sentoo.io with the reference if it still fails.`;
  }

  return `${error.message || "Sentoo request failed."}${reference}`;
}

async function parseSentooResponse<T extends SentooSuccessEnvelope<unknown>>(
  response: Response,
  currency: string,
): Promise<T> {
  const json = (await response.json()) as T | SentooErrorEnvelope;

  if ("error" in json) {
    throw new Error(formatSentooError(json.error, currency));
  }

  if (!response.ok) {
    throw new Error("Sentoo request failed.");
  }

  return json;
}

/** Sentoo validates return_url hostnames against the merchant portal allowlist. */
export function resolveSentooReturnBaseUrl(): string {
  const override = process.env.SENTOO_RETURN_URL_BASE?.trim().replace(/\/$/, "");
  if (override?.startsWith("https://") && !override.includes("localhost")) {
    return override;
  }
  const vercelUrl = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (process.env.VERCEL_ENV !== "production" && vercelUrl) {
    return vercelUrl.startsWith("https://") ? vercelUrl : `https://${vercelUrl}`;
  }
  return SITE_URL;
}

export function buildSentooReturnUrl(bookingId: string, bookingTestCode?: string | null): string {
  const explicit = process.env.SENTOO_RETURN_URL?.trim();
  if (explicit) return explicit;

  const siteUrl = resolveSentooReturnBaseUrl().replace(/\/$/, "");
  const params = new URLSearchParams({
    step: "confirmation",
    bookingId,
    attempt: "",
  });

  if (bookingTestCode?.trim()) {
    params.set("code", bookingTestCode.trim());
  }

  return `${siteUrl}/book?${params.toString()}`;
}

/** Sentoo-hosted return page — works without merchant hostname allowlist (sandbox testing). */
export function buildSentooSandboxFallbackReturnUrl(): string | null {
  const config = getSentooConfig();
  if (!config?.apiHost.includes("sandbox")) return null;
  return `${config.payHost}/thank-you?status=`;
}

export function sentooPaymentUrl(transactionId: string): string | null {
  const config = getSentooConfig();
  if (!config) return null;
  return `${config.payHost}/p/${transactionId}`;
}

export function amountToSentooCents(total: number): number {
  const cents = Math.round(Number(total) * 100);
  return Math.max(cents, 100);
}

export function buildSentooDescription(reference: string): string {
  const base = `QuickKey rental ${reference}`.trim();
  return base.length > 50 ? base.slice(0, 50) : base;
}

export async function createSentooPaymentWithFallback(input: {
  amountCents: number;
  description: string;
  returnUrl: string;
  customerRef?: string;
}): Promise<SentooCreatePaymentResult> {
  try {
    return await createSentooPayment(input);
  } catch (error) {
    const fallbackReturnUrl = buildSentooSandboxFallbackReturnUrl();
    const message = error instanceof Error ? error.message : "";
    const isHostnameOrPortalError =
      message.includes("could not start checkout") || message.includes("parameters were valid");

    if (!fallbackReturnUrl || !isHostnameOrPortalError || fallbackReturnUrl === input.returnUrl) {
      throw error;
    }

    return createSentooPayment({
      ...input,
      returnUrl: fallbackReturnUrl,
    });
  }
}

export async function createSentooPayment(input: {
  amountCents: number;
  description: string;
  returnUrl: string;
  customerRef?: string;
}): Promise<SentooCreatePaymentResult> {
  const config = getSentooConfig();
  if (!config) {
    throw new Error("Sentoo is not configured.");
  }

  const body = new URLSearchParams({
    sentoo_merchant: config.merchantId,
    sentoo_amount: String(input.amountCents),
    sentoo_description: input.description,
    sentoo_currency: config.currency,
    sentoo_return_url: input.returnUrl,
  });

  if (input.customerRef) {
    body.set("sentoo_customer", input.customerRef.slice(0, 50));
  }

  const response = await fetch(`${config.apiHost}/v1/payment/new`, {
    method: "POST",
    headers: sentooHeaders(config.merchantSecret),
    body,
  });

  const json = await parseSentooResponse<SentooSuccessEnvelope<{ url: string; qr_code: string }>>(
    response,
    config.currency,
  );

  const transactionId = json.success.message;
  const url = json.success.data?.url ?? sentooPaymentUrl(transactionId);

  if (!url) {
    throw new Error("Sentoo did not return a payment URL.");
  }

  return {
    transactionId,
    url,
    qrCode: json.success.data?.qr_code ?? "",
  };
}

export async function getSentooTransactionStatus(
  transactionId: string,
): Promise<SentooStatusResult> {
  const config = getSentooConfig();
  if (!config) {
    throw new Error("Sentoo is not configured.");
  }

  const response = await fetch(
    `${config.apiHost}/v1/payment/status/${config.merchantId}/${transactionId}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-SENTOO-SECRET": config.merchantSecret,
      },
    },
  );

  const json = await parseSentooResponse<SentooSuccessEnvelope<Record<string, unknown>>>(
    response,
    config.currency,
  );

  return {
    status: extractSentooStatus(json.success.message, json.success.data),
    data: json.success.data,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function normalizeSentooStatus(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_") || null
  );
}

function collectStatusFields(value: unknown, statuses: string[] = []): string[] {
  if (!value || typeof value !== "object") return statuses;

  if (Array.isArray(value)) {
    value.forEach((item) => collectStatusFields(item, statuses));
    return statuses;
  }

  Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes("status") || keyLower.includes("result")) {
      const normalized = normalizeSentooStatus(nestedValue);
      if (normalized) statuses.push(normalized);
    }
    collectStatusFields(nestedValue, statuses);
  });

  return statuses;
}

export function extractSentooStatus(
  message: string | null | undefined,
  data?: Record<string, unknown>,
): SentooTransactionStatus {
  const messageStatus = normalizeSentooStatus(message) ?? "issued";
  const nestedStatuses = collectStatusFields(data);

  if (SENTOO_SUCCESS_STATUSES.has(messageStatus)) return messageStatus;
  const successfulNestedStatus = nestedStatuses.find((status) =>
    SENTOO_SUCCESS_STATUSES.has(status),
  );
  if (successfulNestedStatus) return successfulNestedStatus;

  if (SENTOO_TERMINAL_FAILURE_STATUSES.has(messageStatus)) return messageStatus;
  const terminalNestedStatus = nestedStatuses
    .slice()
    .reverse()
    .find((status) => SENTOO_TERMINAL_FAILURE_STATUSES.has(status));
  if (terminalNestedStatus) return terminalNestedStatus;

  return messageStatus;
}

export async function getSettledSentooTransactionStatus(
  transactionId: string,
  options: { attempts?: number; delayMs?: number } = {},
): Promise<SentooStatusResult> {
  const attempts = Math.max(1, options.attempts ?? SENTOO_STATUS_RECHECK_ATTEMPTS);
  const delayMs = Math.max(0, options.delayMs ?? SENTOO_STATUS_RECHECK_DELAY_MS);
  let result = await getSentooTransactionStatus(transactionId);

  for (let attempt = 1; attempt < attempts && isSentooStatusReusable(result.status); attempt += 1) {
    if (delayMs > 0) await sleep(delayMs);
    result = await getSentooTransactionStatus(transactionId);
  }

  return result;
}

export async function cancelSentooTransaction(transactionId: string): Promise<void> {
  const config = getSentooConfig();
  if (!config) {
    throw new Error("Sentoo is not configured.");
  }

  const response = await fetch(
    `${config.apiHost}/v1/payment/cancel/${config.merchantId}/${transactionId}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-SENTOO-SECRET": config.merchantSecret,
      },
    },
  );

  await parseSentooResponse<SentooSuccessEnvelope<unknown>>(response, config.currency);
}

export function isSentooStatusFinal(status: string | null | undefined): boolean {
  return (
    status === "success" ||
    status === "cancelled" ||
    status === "expired" ||
    status === "failed" ||
    status === "rejected"
  );
}

export function isSentooStatusReusable(status: string | null | undefined): boolean {
  return status == null || SENTOO_ACTIVE_STATUSES.has(status);
}
