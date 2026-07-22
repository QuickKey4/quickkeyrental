import { Link } from "@tanstack/react-router";
import { useState } from "react";

import type { getAdminDocuments } from "../api/admin.functions";
import {
  deleteAdminDocument,
  getAdminDocumentUrl,
  updateAdminDocumentStatus,
} from "../api/admin.functions";
import { AdminBadge, AdminButton, AdminCard } from "./admin-ui";
import { useAdminI18n } from "../hooks/use-admin-i18n";
import { isHiddenAdminCustomer } from "../lib/admin-utils";

type AdminDocument = Awaited<ReturnType<typeof getAdminDocuments>>["documents"][number];

type AdminDocumentCardProps = {
  doc: AdminDocument;
  adminSecret: string | null;
  onChanged: () => void;
  compact?: boolean;
};

function statusTone(status: string): "neutral" | "green" | "amber" | "red" {
  if (status === "approved" || status === "verified") return "green";
  if (status === "rejected") return "red";
  if (status === "deleted") return "neutral";
  return "amber";
}

function documentStatus(doc: AdminDocument): string {
  return doc.deleted_at ? "deleted" : String(doc.verification_status ?? "pending");
}

export function AdminDocumentCard({
  doc,
  adminSecret,
  onChanged,
  compact = false,
}: AdminDocumentCardProps) {
  const { t, intlLocale, translateError } = useAdminI18n();
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deletionReason, setDeletionReason] = useState("");

  const status = documentStatus(doc);
  const isDeleted = status === "deleted";
  const profile = doc.profiles;
  const booking = doc.booking;
  const customerName = profile?.full_name ?? booking?.guest_name ?? t.documents.unknownCustomer;
  const customerEmail = profile?.email ?? booking?.guest_email ?? "";
  const shouldLinkCustomer =
    customerEmail &&
    !isHiddenAdminCustomer({
      guest_email: customerEmail,
      guest_name: customerName,
    });
  const bookingRef = booking?.id ? booking.id.slice(0, 8).toUpperCase() : "";
  const documentTypeLabel =
    t.documents.types[doc.document_type] ?? doc.document_type.replaceAll("_", " ");

  const formatDateTime = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(intlLocale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(value))
      : "—";

  const openDocument = async (download = false) => {
    if (!adminSecret || isDeleted) return;
    setOpening(true);
    setError("");
    try {
      const { url, fileName } = await getAdminDocumentUrl({
        data: { adminSecret, documentId: doc.id },
      });
      if (download) {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
        anchor.click();
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setError(e instanceof Error ? translateError(e.message) : t.documents.openError);
    } finally {
      setOpening(false);
    }
  };

  const approveDocument = async () => {
    if (!adminSecret) return;
    setSaving(true);
    setError("");
    try {
      await updateAdminDocumentStatus({
        data: { adminSecret, documentId: doc.id, status: "approved" },
      });
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? translateError(e.message) : t.documents.statusError);
    } finally {
      setSaving(false);
    }
  };

  const rejectDocument = async () => {
    if (!adminSecret || !rejectionReason.trim()) return;
    setSaving(true);
    setError("");
    try {
      await updateAdminDocumentStatus({
        data: {
          adminSecret,
          documentId: doc.id,
          status: "rejected",
          rejectionReason: rejectionReason.trim(),
        },
      });
      setRejecting(false);
      setRejectionReason("");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? translateError(e.message) : t.documents.statusError);
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async () => {
    if (!adminSecret || !deletionReason.trim()) return;
    setSaving(true);
    setError("");
    try {
      await deleteAdminDocument({
        data: { adminSecret, documentId: doc.id, deletionReason: deletionReason.trim() },
      });
      setDeleting(false);
      setDeletionReason("");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? translateError(e.message) : t.documents.deleteError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard className={compact ? "p-4" : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div>
            <p className="font-semibold text-[var(--logo-black)]">{customerName}</p>
            {shouldLinkCustomer ? (
              <Link
                to="/admin/customers/$email"
                params={{ email: customerEmail }}
                className="text-sm text-[var(--logo-red)] hover:underline"
              >
                {customerEmail}
              </Link>
            ) : customerEmail ? (
              <p className="text-sm text-muted-foreground">{customerEmail}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t.documents.customerUnavailable}</p>
            )}
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {booking?.id ? (
              <Link
                to="/admin/bookings/$bookingId"
                params={{ bookingId: booking.id }}
                className="font-semibold text-[var(--logo-black)] hover:text-[var(--logo-red)]"
              >
                {t.documents.bookingRef}: {bookingRef}
              </Link>
            ) : (
              <span>{t.documents.bookingUnavailable}</span>
            )}
            <span>
              {t.documents.pickup}: {booking?.pickup_date ?? "—"}
            </span>
            <span>
              {t.documents.vehicle}: {booking?.cars?.name ?? "—"}
            </span>
            <span>
              {t.documents.uploaded}: {formatDateTime(doc.created_at ?? doc.uploaded_at)}
            </span>
          </div>
          <div>
            <h3 className="break-words font-semibold">{doc.file_name}</h3>
            <p className="text-sm text-muted-foreground">
              {documentTypeLabel} · {doc.mime_type ?? t.documents.file}
            </p>
          </div>
        </div>
        <AdminBadge tone={statusTone(status)}>
          {t.documents.status[status as keyof typeof t.documents.status] ?? status}
        </AdminBadge>
      </div>

      {status === "rejected" && doc.deletion_reason ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {t.documents.rejectionReason}: {doc.deletion_reason}
        </p>
      ) : null}

      {isDeleted ? (
        <p className="mt-4 rounded-xl bg-black/[0.04] px-3 py-2 text-sm text-muted-foreground">
          {t.documents.deletedAt}: {formatDateTime(doc.deleted_at)}
          {doc.deletion_reason ? ` · ${t.documents.deletionReason}: ${doc.deletion_reason}` : ""}
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!isDeleted ? (
          <>
            <AdminButton
              variant="secondary"
              disabled={opening}
              onClick={() => void openDocument(false)}
            >
              {t.view}
            </AdminButton>
            <AdminButton
              variant="secondary"
              disabled={opening}
              onClick={() => void openDocument(true)}
            >
              {t.download}
            </AdminButton>
          </>
        ) : null}
        {status === "pending" || status === "uploaded" ? (
          <>
            <AdminButton variant="primary" disabled={saving} onClick={() => void approveDocument()}>
              {t.approve}
            </AdminButton>
            <AdminButton variant="danger" disabled={saving} onClick={() => setRejecting(true)}>
              {t.reject}
            </AdminButton>
          </>
        ) : null}
        {!isDeleted ? (
          <AdminButton variant="danger" disabled={saving} onClick={() => setDeleting(true)}>
            {t.documents.deleteDocument}
          </AdminButton>
        ) : null}
      </div>

      {rejecting ? (
        <DocumentActionModal
          title={t.documents.rejectTitle}
          body={t.documents.rejectBody.replace("{file}", doc.file_name ?? t.documents.document)}
          label={t.documents.rejectionReason}
          value={rejectionReason}
          onChange={setRejectionReason}
          onCancel={() => {
            setRejecting(false);
            setRejectionReason("");
          }}
          onConfirm={() => void rejectDocument()}
          confirmLabel={t.documents.rejectDocument}
          saving={saving}
          reasons={t.documents.rejectionReasons}
        />
      ) : null}

      {deleting ? (
        <DocumentActionModal
          title={t.documents.deleteTitle}
          body={t.documents.deleteBody
            .replace("{customer}", customerName)
            .replace("{booking}", bookingRef || "—")
            .replace("{type}", documentTypeLabel)
            .replace("{file}", doc.file_name ?? t.documents.document)}
          label={t.documents.deletionReason}
          value={deletionReason}
          onChange={setDeletionReason}
          onCancel={() => {
            setDeleting(false);
            setDeletionReason("");
          }}
          onConfirm={() => void deleteDocument()}
          confirmLabel={t.documents.deleteDocument}
          saving={saving}
        />
      ) : null}
    </AdminCard>
  );
}

function DocumentActionModal({
  title,
  body,
  label,
  value,
  onChange,
  onCancel,
  onConfirm,
  confirmLabel,
  saving,
  reasons,
}: {
  title: string;
  body: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  saving: boolean;
  reasons?: string[];
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
      <div className="w-full max-w-lg rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        {reasons ? (
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="mt-5 h-12 w-full rounded-xl border border-black/10 bg-[#f8f8f6] px-4 text-sm outline-none focus:border-[var(--logo-red)]"
          >
            <option value="">Choose a reason</option>
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        ) : null}
        <label className="mt-4 block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </span>
          <textarea
            value={reasons?.includes(value) ? "" : value}
            onChange={(event) => onChange(event.target.value)}
            className="mt-2 min-h-24 w-full rounded-xl border border-black/10 bg-[#f8f8f6] px-4 py-3 text-sm outline-none focus:border-[var(--logo-red)]"
          />
        </label>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <AdminButton variant="secondary" onClick={onCancel}>
            Cancel
          </AdminButton>
          <AdminButton variant="danger" disabled={!value.trim() || saving} onClick={onConfirm}>
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
