import type { SupportedLocale } from "@/i18n/config";
import { BRAND } from "@/lib/brand";
import { contactHrefs } from "@/lib/contact-links";
import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";
import type { Json } from "@/lib/supabase/database.types";

export type EmailTemplateInput = {
  bookingRef?: string | null;
  guestName?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  vehicle?: string | null;
  pickup?: string | null;
  return?: string | null;
  dateRange?: string | null;
  delivery?: string | null;
  collection?: string | null;
  total?: string | null;
  paymentStatus?: string | null;
  cancellationFee?: string | null;
  cancellationFeeStatus?: string | null;
  documentType?: string | null;
  documentId?: string | null;
  uploadedAt?: string | null;
  deletedAt?: string | null;
  rejectionReason?: string | null;
  deletionReason?: string | null;
  accountUrl?: string | null;
  adminUrl?: string | null;
  ctaHref?: string | null;
  ctaLabel?: string | null;
};

export type EmailMessage = {
  subject: string;
  html: string;
  text: string;
};

type DetailRow = { label: string; value?: string | number | null };
type LoggedEmailStatus = "sent" | "skipped";
type LoggedEmailOptions = {
  templateKey: string;
  locale: SupportedLocale;
  to: string;
  input: EmailTemplateInput;
  idempotencyKey: string;
  bookingId?: string | null;
  documentId?: string | null;
  customerId?: string | null;
};
type TemplateContent = {
  subject: string;
  title: string;
  intro: string;
  details?: DetailRow[];
  ctaLabel?: string;
  ctaHref?: string | null;
  note?: string;
};

const SITE_URL = BRAND.website;
const ACCOUNT_URL = `${SITE_URL}/account`;
const ADMIN_URL = `${SITE_URL}/admin`;
const LOGO_URL = `${SITE_URL}/quick-key-rental-logo-transparent.png`;

const localeFallback: SupportedLocale = "en";

const supportCopy: Record<SupportedLocale, { help: string; whatsapp: string; footer: string }> = {
  en: {
    help: "Need help with your rental?",
    whatsapp: "Message Quick Key on WhatsApp",
    footer: "Quick Key Rental · Curaçao",
  },
  nl: {
    help: "Hulp nodig met je huurauto?",
    whatsapp: "Stuur Quick Key een WhatsApp",
    footer: "Quick Key Rental · Curaçao",
  },
  es: {
    help: "¿Necesitas ayuda con tu alquiler?",
    whatsapp: "Escribe a Quick Key por WhatsApp",
    footer: "Quick Key Rental · Curaçao",
  },
  pap: {
    help: "Bo mester yudansa ku bo outo di huur?",
    whatsapp: "Manda Quick Key un WhatsApp",
    footer: "Quick Key Rental · Kòrsou",
  },
  pt: {
    help: "Precisa de ajuda com o seu aluguer?",
    whatsapp: "Envie mensagem à Quick Key no WhatsApp",
    footer: "Quick Key Rental · Curaçao",
  },
};

const labels: Record<
  SupportedLocale,
  Record<
    | "bookingRef"
    | "vehicle"
    | "pickup"
    | "return"
    | "period"
    | "delivery"
    | "collection"
    | "total"
    | "paymentStatus"
    | "documentType"
    | "reason"
    | "deletedAt"
    | "customer"
    | "email"
    | "phone"
    | "cancellationFee"
    | "feeStatus",
    string
  >
> = {
  en: {
    bookingRef: "Booking reference",
    vehicle: "Vehicle",
    pickup: "Pickup",
    return: "Return",
    period: "Rental period",
    delivery: "Delivery",
    collection: "Collection",
    total: "Total",
    paymentStatus: "Payment status",
    documentType: "Document",
    reason: "Reason",
    deletedAt: "Deleted",
    customer: "Customer",
    email: "Email",
    phone: "Phone",
    cancellationFee: "Cancellation fee",
    feeStatus: "Fee handling",
  },
  nl: {
    bookingRef: "Boekingsreferentie",
    vehicle: "Auto",
    pickup: "Ophaal",
    return: "Retour",
    period: "Huurperiode",
    delivery: "Aflevering",
    collection: "Inleveren",
    total: "Totaal",
    paymentStatus: "Betaalstatus",
    documentType: "Document",
    reason: "Reden",
    deletedAt: "Verwijderd",
    customer: "Klant",
    email: "E-mail",
    phone: "Telefoon",
    cancellationFee: "Annuleringskosten",
    feeStatus: "Afhandeling kosten",
  },
  es: {
    bookingRef: "Referencia de reserva",
    vehicle: "Coche",
    pickup: "Recogida",
    return: "Devolución",
    period: "Periodo de alquiler",
    delivery: "Entrega",
    collection: "Recogida",
    total: "Total",
    paymentStatus: "Estado del pago",
    documentType: "Documento",
    reason: "Motivo",
    deletedAt: "Eliminado",
    customer: "Cliente",
    email: "Email",
    phone: "Teléfono",
    cancellationFee: "Cargo de cancelación",
    feeStatus: "Gestión del cargo",
  },
  pap: {
    bookingRef: "Referensia di reserva",
    vehicle: "Outo",
    pickup: "Entrega",
    return: "Devolushon",
    period: "Periodo di huur",
    delivery: "Entrega",
    collection: "Kolekshon",
    total: "Total",
    paymentStatus: "Estado di pago",
    documentType: "Dokumento",
    reason: "Motibu",
    deletedAt: "Eliminá",
    customer: "Cliente",
    email: "Email",
    phone: "Telefon",
    cancellationFee: "Kosto di kanselashon",
    feeStatus: "Tratamentu di kosto",
  },
  pt: {
    bookingRef: "Referência da reserva",
    vehicle: "Carro",
    pickup: "Levantamento",
    return: "Devolução",
    period: "Período de aluguer",
    delivery: "Entrega",
    collection: "Recolha",
    total: "Total",
    paymentStatus: "Estado do pagamento",
    documentType: "Documento",
    reason: "Motivo",
    deletedAt: "Eliminado",
    customer: "Cliente",
    email: "Email",
    phone: "Telefone",
    cancellationFee: "Taxa de cancelamento",
    feeStatus: "Tratamento da taxa",
  },
};

function normalizeLocale(locale: SupportedLocale): SupportedLocale {
  return locale === "nl" || locale === "es" || locale === "pap" || locale === "pt"
    ? locale
    : localeFallback;
}

export function resolveEmailLocale(value: unknown): SupportedLocale {
  return value === "nl" || value === "es" || value === "pap" || value === "pt" ? value : "en";
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rowsHtml(rows: DetailRow[] = []): string {
  const visible = rows.filter(
    (row) => row.value !== undefined && row.value !== null && row.value !== "",
  );
  if (!visible.length) return "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin:20px 0;background:#fafafa;border:1px solid #eeeeee;border-radius:8px">
    ${visible
      .map(
        (row) => `<tr>
          <td style="padding:10px 14px;border-bottom:1px solid #eeeeee;color:#666666;font-size:13px;vertical-align:top">${escapeHtml(row.label)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #eeeeee;color:#101010;font-size:13px;font-weight:700;text-align:right;vertical-align:top">${escapeHtml(row.value)}</td>
        </tr>`,
      )
      .join("")}
  </table>`;
}

function rowsText(rows: DetailRow[] = []): string {
  return rows
    .filter((row) => row.value !== undefined && row.value !== null && row.value !== "")
    .map((row) => `${row.label}: ${row.value}`)
    .join("\n");
}

function buttonHtml(label?: string, href?: string | null): string {
  if (!label || !href) return "";
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto">
    <tr>
      <td align="center" style="border-radius:999px;background:#ef2b32">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 26px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;color:#ffffff;border-radius:999px;background:#ef2b32">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

function buildHtml(locale: SupportedLocale, content: TemplateContent): string {
  const support = supportCopy[locale];
  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${escapeHtml(content.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#101010;-webkit-text-size-adjust:100%">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f5">
      <tr>
        <td align="center" style="padding:28px 14px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e8e8e8;border-radius:14px;overflow:hidden">
            <tr>
              <td style="padding:28px 30px 22px;text-align:center;border-bottom:3px solid #ef2b32">
                <a href="${SITE_URL}" style="text-decoration:none;color:#101010">
                  <img src="${LOGO_URL}" width="180" alt="Quick Key Rental" style="display:block;width:180px;max-width:80%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none">
                  <p style="margin:12px 0 0;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#666666">Car rental · Curaçao</p>
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 30px">
                <h1 style="margin:0 0 14px;font-size:25px;line-height:1.25;font-weight:850;color:#101010">${escapeHtml(content.title)}</h1>
                <p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#444444">${escapeHtml(content.intro)}</p>
                ${rowsHtml(content.details)}
                ${buttonHtml(content.ctaLabel, content.ctaHref)}
                ${
                  content.note
                    ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#666666">${escapeHtml(content.note)}</p>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 30px">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7fff9;border:1px solid #c8f1d3;border-radius:10px">
                  <tr>
                    <td style="padding:18px">
                      <p style="margin:0 0 8px;font-size:13px;font-weight:800;color:#101010">${escapeHtml(support.help)}</p>
                      <a href="${contactHrefs.whatsapp}" style="font-size:13px;font-weight:800;color:#128c7e;text-decoration:none">${escapeHtml(support.whatsapp)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 30px 26px;text-align:center;background:#101010">
                <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ffffff">${escapeHtml(support.footer)}</p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#aaaaaa">
                  <a href="mailto:${BRAND.email}" style="color:#ef2b32;text-decoration:none">${BRAND.email}</a>
                  <span style="color:#666666"> · </span>
                  <a href="${SITE_URL}" style="color:#ef2b32;text-decoration:none">quickkeyrentalcar.com</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildText(locale: SupportedLocale, content: TemplateContent): string {
  return [
    "Quick Key Rental",
    content.title,
    "",
    content.intro,
    "",
    rowsText(content.details),
    content.ctaHref && content.ctaLabel ? `${content.ctaLabel}: ${content.ctaHref}` : "",
    content.note ?? "",
    "",
    `${supportCopy[locale].help} ${contactHrefs.whatsapp}`,
    `${supportCopy[locale].footer} · ${BRAND.email}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function bookingRows(locale: SupportedLocale, input: EmailTemplateInput): DetailRow[] {
  const l = labels[locale];
  return [
    { label: l.bookingRef, value: input.bookingRef },
    { label: l.vehicle, value: input.vehicle },
    { label: l.pickup, value: input.pickup },
    { label: l.return, value: input.return },
    { label: l.period, value: input.dateRange },
    { label: l.delivery, value: input.delivery },
    { label: l.collection, value: input.collection },
    { label: l.total, value: input.total },
    { label: l.paymentStatus, value: input.paymentStatus },
  ];
}

function adminRows(input: EmailTemplateInput): DetailRow[] {
  return [
    { label: "Booking reference", value: input.bookingRef },
    { label: "Customer", value: input.customerName ?? input.guestName },
    { label: "Email", value: input.customerEmail },
    { label: "Phone", value: input.customerPhone },
    { label: "Vehicle", value: input.vehicle },
    { label: "Pickup", value: input.pickup },
    { label: "Return", value: input.return },
    { label: "Delivery", value: input.delivery },
    { label: "Collection", value: input.collection },
    { label: "Total", value: input.total },
    { label: "Payment status", value: input.paymentStatus },
    { label: "Cancellation fee", value: input.cancellationFee },
    { label: "Fee handling", value: input.cancellationFeeStatus },
    { label: "Document", value: input.documentType },
    { label: "Document ID", value: input.documentId },
    { label: "Uploaded", value: input.uploadedAt },
    { label: "Deleted", value: input.deletedAt },
  ];
}

function documentRows(locale: SupportedLocale, input: EmailTemplateInput): DetailRow[] {
  const l = labels[locale];
  return [
    { label: l.bookingRef, value: input.bookingRef },
    { label: l.documentType, value: input.documentType },
    { label: l.deletedAt, value: input.deletedAt },
    { label: l.reason, value: input.rejectionReason ?? input.deletionReason },
  ];
}

function contentFor(templateKey: string, locale: SupportedLocale, input: EmailTemplateInput) {
  const ref = input.bookingRef ? ` ${input.bookingRef}` : "";
  const name = input.guestName || input.customerName || "there";
  const accountUrl = input.accountUrl ?? input.ctaHref ?? ACCOUNT_URL;
  const adminUrl = input.adminUrl ?? input.ctaHref ?? ADMIN_URL;

  const templates: Record<string, Record<SupportedLocale, TemplateContent>> = {
    booking_confirmation: {
      en: {
        subject: `Booking confirmed${ref}`,
        title: "Your Quick Key booking is confirmed",
        intro: `Thanks, ${name}. Your booking is confirmed and your details are ready.`,
        details: bookingRows(locale, input),
        ctaLabel: input.ctaLabel ?? "View booking",
        ctaHref: accountUrl,
      },
      nl: {
        subject: `Boeking bevestigd${ref}`,
        title: "Je Quick Key boeking is bevestigd",
        intro: `Bedankt, ${name}. Je boeking is bevestigd en je gegevens staan klaar.`,
        details: bookingRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Bekijk boeking",
        ctaHref: accountUrl,
      },
      es: {
        subject: `Reserva confirmada${ref}`,
        title: "Tu reserva de Quick Key está confirmada",
        intro: `Gracias, ${name}. Tu reserva está confirmada y los detalles están listos.`,
        details: bookingRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Ver reserva",
        ctaHref: accountUrl,
      },
      pap: {
        subject: `Reserva konfirmá${ref}`,
        title: "Bo reserva di Quick Key ta konfirmá",
        intro: `Masha danki, ${name}. Bo reserva ta konfirmá i e detayenan ta kla.`,
        details: bookingRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Mira reserva",
        ctaHref: accountUrl,
      },
      pt: {
        subject: `Reserva confirmada${ref}`,
        title: "A sua reserva Quick Key está confirmada",
        intro: `Obrigado, ${name}. A sua reserva está confirmada e os detalhes estão prontos.`,
        details: bookingRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Ver reserva",
        ctaHref: accountUrl,
      },
    },
    cancellation: {
      en: {
        subject: `Booking cancelled${ref}`,
        title: "Your booking was cancelled",
        intro: `Hi ${name}, your Quick Key booking has been cancelled as requested.`,
        details: [
          ...bookingRows(locale, input),
          { label: labels[locale].cancellationFee, value: input.cancellationFee },
          { label: labels[locale].feeStatus, value: input.cancellationFeeStatus },
        ],
        ctaLabel: input.ctaLabel ?? "View booking",
        ctaHref: accountUrl,
        note:
          input.cancellationFee &&
          "If a cancellation fee applies, it is handled manually according to Quick Key policy. This email does not confirm a refund or charge was processed.",
      },
      nl: {
        subject: `Boeking geannuleerd${ref}`,
        title: "Je boeking is geannuleerd",
        intro: `Hoi ${name}, je Quick Key boeking is geannuleerd zoals aangevraagd.`,
        details: [
          ...bookingRows(locale, input),
          { label: labels[locale].cancellationFee, value: input.cancellationFee },
          { label: labels[locale].feeStatus, value: input.cancellationFeeStatus },
        ],
        ctaLabel: input.ctaLabel ?? "Bekijk boeking",
        ctaHref: accountUrl,
        note:
          input.cancellationFee &&
          "Als annuleringskosten gelden, worden die handmatig afgehandeld volgens het beleid van Quick Key. Deze e-mail bevestigt niet dat een terugbetaling of betaling is verwerkt.",
      },
      es: {
        subject: `Reserva cancelada${ref}`,
        title: "Tu reserva fue cancelada",
        intro: `Hola ${name}, tu reserva de Quick Key fue cancelada como solicitaste.`,
        details: [
          ...bookingRows(locale, input),
          { label: labels[locale].cancellationFee, value: input.cancellationFee },
          { label: labels[locale].feeStatus, value: input.cancellationFeeStatus },
        ],
        ctaLabel: input.ctaLabel ?? "Ver reserva",
        ctaHref: accountUrl,
        note:
          input.cancellationFee &&
          "Si aplica un cargo de cancelación, se gestionará manualmente según la política de Quick Key. Este email no confirma que se haya procesado un cobro o reembolso.",
      },
      pap: {
        subject: `Reserva kanselá${ref}`,
        title: "Bo reserva a wordu kanselá",
        intro: `Bon dia ${name}, bo reserva di Quick Key a wordu kanselá manera bo a pidi.`,
        details: [
          ...bookingRows(locale, input),
          { label: labels[locale].cancellationFee, value: input.cancellationFee },
          { label: labels[locale].feeStatus, value: input.cancellationFeeStatus },
        ],
        ctaLabel: input.ctaLabel ?? "Mira reserva",
        ctaHref: accountUrl,
        note:
          input.cancellationFee &&
          "Si tin kosto di kanselashon, Quick Key lo trata esaki manualmente segun e regla. E email aki no ta konfirmá ku un pago of reembolso a wordu prosesá.",
      },
      pt: {
        subject: `Reserva cancelada${ref}`,
        title: "A sua reserva foi cancelada",
        intro: `Olá ${name}, a sua reserva Quick Key foi cancelada conforme solicitado.`,
        details: [
          ...bookingRows(locale, input),
          { label: labels[locale].cancellationFee, value: input.cancellationFee },
          { label: labels[locale].feeStatus, value: input.cancellationFeeStatus },
        ],
        ctaLabel: input.ctaLabel ?? "Ver reserva",
        ctaHref: accountUrl,
        note:
          input.cancellationFee &&
          "Se for aplicada uma taxa de cancelamento, será tratada manualmente de acordo com a política da Quick Key. Este email não confirma que um pagamento ou reembolso foi processado.",
      },
    },
    document_approved: {
      en: {
        subject: "Your document has been approved",
        title: "Your document has been approved",
        intro: `Hi ${name}, your document has been reviewed and approved by Quick Key Rental.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Open my account",
        ctaHref: accountUrl,
      },
      nl: {
        subject: "Je document is goedgekeurd",
        title: "Je document is goedgekeurd",
        intro: `Hoi ${name}, je document is gecontroleerd en goedgekeurd door Quick Key Rental.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Open mijn account",
        ctaHref: accountUrl,
      },
      es: {
        subject: "Tu documento fue aprobado",
        title: "Tu documento fue aprobado",
        intro: `Hola ${name}, Quick Key Rental revisó y aprobó tu documento.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Abrir mi cuenta",
        ctaHref: accountUrl,
      },
      pap: {
        subject: "Bo dokumento a wordu aprobá",
        title: "Bo dokumento a wordu aprobá",
        intro: `Bon dia ${name}, Quick Key Rental a kontrolá i aprobá bo dokumento.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Habri mi account",
        ctaHref: accountUrl,
      },
      pt: {
        subject: "O seu documento foi aprovado",
        title: "O seu documento foi aprovado",
        intro: `Olá ${name}, o seu documento foi analisado e aprovado pela Quick Key Rental.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Abrir a minha conta",
        ctaHref: accountUrl,
      },
    },
    document_rejected: {
      en: {
        subject: "Please upload your document again",
        title: "Please upload your document again",
        intro: `Hi ${name}, we could not approve your document yet. Please upload a new copy in your account.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Upload document",
        ctaHref: accountUrl,
      },
      nl: {
        subject: "Upload je document opnieuw",
        title: "Upload je document opnieuw",
        intro: `Hoi ${name}, we konden je document nog niet goedkeuren. Upload een nieuwe kopie in je account.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Document uploaden",
        ctaHref: accountUrl,
      },
      es: {
        subject: "Vuelve a subir tu documento",
        title: "Vuelve a subir tu documento",
        intro: `Hola ${name}, todavía no pudimos aprobar tu documento. Sube una nueva copia en tu cuenta.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Subir documento",
        ctaHref: accountUrl,
      },
      pap: {
        subject: "Upload bo dokumento atrobe",
        title: "Upload bo dokumento atrobe",
        intro: `Bon dia ${name}, nos no por a aprobá bo dokumento ainda. Upload un kopia nobo den bo account.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Upload dokumento",
        ctaHref: accountUrl,
      },
      pt: {
        subject: "Envie o seu documento novamente",
        title: "Envie o seu documento novamente",
        intro: `Olá ${name}, ainda não foi possível aprovar o seu documento. Envie uma nova cópia na sua conta.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Enviar documento",
        ctaHref: accountUrl,
      },
    },
    document_deleted: {
      en: {
        subject: "Your uploaded document was deleted",
        title: "Your uploaded document was deleted",
        intro: `Hi ${name}, Quick Key has deleted the uploaded document from your account.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Open my account",
        ctaHref: accountUrl,
        note: "No document image or sensitive document details are included in this email. If this was unexpected, please contact Quick Key through WhatsApp or support.",
      },
      nl: {
        subject: "Je geüploade document is verwijderd",
        title: "Je geüploade document is verwijderd",
        intro: `Hoi ${name}, Quick Key heeft het geüploade document uit je account verwijderd.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Open mijn account",
        ctaHref: accountUrl,
        note: "Deze e-mail bevat geen afbeelding of gevoelige documentgegevens. Neem contact op met Quick Key via WhatsApp of support als dit onverwacht is.",
      },
      es: {
        subject: "Tu documento subido fue eliminado",
        title: "Tu documento subido fue eliminado",
        intro: `Hola ${name}, Quick Key eliminó el documento subido de tu cuenta.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Abrir mi cuenta",
        ctaHref: accountUrl,
        note: "Este email no incluye ninguna imagen ni datos sensibles del documento. Si esto fue inesperado, contacta con Quick Key por WhatsApp o soporte.",
      },
      pap: {
        subject: "Bo dokumento upload a wordu eliminá",
        title: "Bo dokumento upload a wordu eliminá",
        intro: `Bon dia ${name}, Quick Key a eliminá e dokumento upload for di bo account.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Habri mi account",
        ctaHref: accountUrl,
        note: "E email aki no ta inkluí imágen ni dato sensitivo di e dokumento. Si esaki tabata inesperá, tuma kontakto ku Quick Key via WhatsApp òf support.",
      },
      pt: {
        subject: "O seu documento enviado foi eliminado",
        title: "O seu documento enviado foi eliminado",
        intro: `Olá ${name}, a Quick Key eliminou o documento enviado da sua conta.`,
        details: documentRows(locale, input),
        ctaLabel: input.ctaLabel ?? "Abrir a minha conta",
        ctaHref: accountUrl,
        note: "Este email não inclui imagem nem dados sensíveis do documento. Se isto foi inesperado, contacte a Quick Key pelo WhatsApp ou suporte.",
      },
    },
  };

  const adminTemplates: Record<string, TemplateContent> = {
    admin_booking_confirmed: {
      subject: `New confirmed booking${ref}`,
      title: "New booking confirmed",
      intro: "Sentoo confirmed a new Quick Key booking.",
      details: adminRows(input),
      ctaLabel: "Open admin",
      ctaHref: adminUrl,
    },
    admin_booking_cancelled: {
      subject: `Booking cancelled${ref}`,
      title: "Booking cancelled",
      intro: "A customer cancelled a Quick Key booking.",
      details: adminRows(input),
      ctaLabel: "Open admin",
      ctaHref: adminUrl,
      note: input.cancellationFee
        ? "Manual handling may be required for the accepted cancellation fee."
        : undefined,
    },
    admin_document_uploaded: {
      subject: `Document uploaded${ref}`,
      title: "Customer document uploaded",
      intro:
        "A customer uploaded a document for review. Do not handle sensitive files by email; review it in the admin portal.",
      details: adminRows(input),
      ctaLabel: "Review document",
      ctaHref: adminUrl,
    },
    email_smoke_test: {
      subject: "Quick Key email test",
      title: "Quick Key email test",
      intro:
        "This is a safe internal test to confirm Quick Key email delivery and logging are working.",
      details: [
        { label: "Purpose", value: "Production email readiness smoke test" },
        {
          label: "Idempotency key",
          value: "smoke:email-production-readiness:2026-07-13",
        },
      ],
      ctaLabel: input.ctaLabel ?? "Open admin",
      ctaHref: adminUrl,
    },
  };

  if (adminTemplates[templateKey]) return adminTemplates[templateKey];

  const normalizedTemplateKey =
    templateKey === "post_rental_review" ? "honest_review_request" : templateKey;

  if (normalizedTemplateKey === "booking_modification_confirmation") {
    return {
      subject: `Booking updated${ref}`,
      title: "Your booking was updated",
      intro: `Hi ${name}, we updated your Quick Key booking details.`,
      details: bookingRows(locale, input),
      ctaLabel: input.ctaLabel ?? "View booking",
      ctaHref: accountUrl,
    };
  }

  if (normalizedTemplateKey === "post_rental_thank_you") {
    return {
      subject: `Thank you for renting with Quick Key${ref}`,
      title: "Thank you for choosing Quick Key",
      intro: `Hi ${name}, we hope you enjoyed exploring Curaçao with us.`,
      details: bookingRows(locale, input),
    };
  }

  if (normalizedTemplateKey === "honest_review_request") {
    return {
      subject: `How was your Quick Key rental${ref}?`,
      title: "Would you share an honest review?",
      intro: `Hi ${name}, if you have a moment, we would appreciate an honest review about your rental experience.`,
      details: bookingRows(locale, input),
      ctaLabel: "Leave an honest review",
      ctaHref: contactHrefs.review,
    };
  }

  return (
    templates[templateKey]?.[locale] ?? {
      subject: "Quick Key Rental",
      title: "Quick Key Rental",
      intro: "Thank you for choosing Quick Key Rental.",
    }
  );
}

export function renderEmailTemplate(
  templateKey: string,
  locale: SupportedLocale,
  input: EmailTemplateInput,
): EmailMessage {
  const resolvedLocale = normalizeLocale(locale);
  const content = contentFor(templateKey, resolvedLocale, input);
  return {
    subject: content.subject,
    html: buildHtml(resolvedLocale, content),
    text: buildText(resolvedLocale, content),
  };
}

export async function sendResendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");

  const from = process.env.BOOKING_FROM_EMAIL ?? `Quick Key Rental <onboarding@resend.dev>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email failed: ${body}`);
  }
}

function serializeEmailInput(input: EmailTemplateInput): Json {
  return JSON.parse(JSON.stringify(input)) as Json;
}

function emailErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : "Email failed";
}

export async function sendLoggedTemplateEmail({
  templateKey,
  locale,
  to,
  input,
  idempotencyKey,
  bookingId = null,
  documentId = null,
  customerId = null,
}: LoggedEmailOptions): Promise<{ status: LoggedEmailStatus }> {
  const resolvedLocale = normalizeLocale(locale);
  const payload = serializeEmailInput(input);
  const supabase = getSupabaseAdminClient();
  const rendered = renderEmailTemplate(templateKey, resolvedLocale, input);

  const { data: created, error: insertError } = await supabase
    .from("email_deliveries")
    .insert({
      template_key: templateKey,
      locale: resolvedLocale,
      recipient_email: to,
      booking_id: bookingId,
      document_id: documentId,
      customer_id: customerId,
      idempotency_key: idempotencyKey,
      status: "sending",
      attempts: 1,
      payload,
    })
    .select("id")
    .single();

  let deliveryId = created?.id;

  if (insertError) {
    if (insertError.code !== "23505") throw insertError;

    const { data: existing, error: existingError } = await supabase
      .from("email_deliveries")
      .select("id, status, attempts, updated_at")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing?.id) throw insertError;
    const sendingIsFresh =
      existing.status === "sending" &&
      existing.updated_at &&
      Date.now() - new Date(existing.updated_at).getTime() < 10 * 60 * 1000;

    if (existing.status === "sent" || sendingIsFresh) {
      return { status: "skipped" };
    }

    const { error: updateError } = await supabase
      .from("email_deliveries")
      .update({
        status: "sending",
        attempts: Number(existing.attempts ?? 0) + 1,
        locale: resolvedLocale,
        recipient_email: to,
        booking_id: bookingId,
        document_id: documentId,
        customer_id: customerId,
        payload,
        last_error: null,
        next_attempt_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) throw updateError;
    deliveryId = existing.id;
  }

  try {
    await sendResendEmail(to, rendered.subject, rendered.html, rendered.text);
    if (deliveryId) {
      await supabase
        .from("email_deliveries")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
        .eq("id", deliveryId);
    }
    return { status: "sent" };
  } catch (error) {
    if (deliveryId) {
      await supabase
        .from("email_deliveries")
        .update({
          status: "failed",
          last_error: emailErrorMessage(error),
          next_attempt_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        })
        .eq("id", deliveryId);
    }
    throw error;
  }
}
