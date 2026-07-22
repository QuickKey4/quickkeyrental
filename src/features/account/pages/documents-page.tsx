import { FileUp, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useI18n } from "@/i18n/provider";
import type { Database } from "@/lib/supabase/database.types";

import { deleteDocument, fetchDocuments, uploadDocument, type Document } from "../account-queries";
import { useAuth } from "../auth-provider";
import { AccountContent } from "../account-layout";
import { AccountCard, AccountPageHeader, AccountPrimaryButton } from "../components/account-ui";

type DocumentType = Database["public"]["Enums"]["document_type"];

export function DocumentsPage() {
  const { messages } = useI18n();
  const { user } = useAuth();
  const copy = messages.account.documents;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("driver_license");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes: DocumentType[] = ["driver_license", "passport_id", "id_card"];

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(undefined, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(value))
      : "";

  const loadDocuments = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      setDocuments(await fetchDocuments(user.id));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (file: File | null) => {
    if (!file || !user?.id) return;

    setUploading(true);
    setError("");
    try {
      await uploadDocument(user.id, documentType, file);
      await loadDocuments();
    } catch {
      setError(copy.uploadError);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!user?.id || !window.confirm(copy.deleteConfirm)) return;
    setError("");
    try {
      await deleteDocument(documentId);
      await loadDocuments();
    } catch {
      setError(copy.uploadError);
    }
  };

  return (
    <AccountContent className="space-y-6">
      <AccountPageHeader title={copy.title} subtitle={copy.subtitle} />

      <AccountCard>
        <div className="mb-5 space-y-3 rounded-2xl border border-black/[0.06] bg-white p-4 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-[var(--logo-black)]">{copy.privacyTitle}</p>
          <p>{copy.privacyBody}</p>
          <ul className="list-disc space-y-1 pl-5">
            {copy.guidance.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{copy.pickupAlternative}</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {copy.type}
          </span>
          <select
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value as DocumentType)}
            className="h-12 rounded-xl border border-black/[0.08] bg-[#f8f8f6] px-4 text-base outline-none focus:border-[var(--logo-red)] focus:bg-white sm:text-sm"
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {copy.types[type]}
              </option>
            ))}
          </select>
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)}
        />

        <AccountPrimaryButton
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 w-full border border-dashed border-[var(--logo-red)]/30 bg-[var(--logo-red)]/5 text-[var(--logo-red)] shadow-none hover:bg-[var(--logo-red)]/10 hover:shadow-none"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
          {copy.upload}
        </AccountPrimaryButton>

        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </AccountCard>

      {loading ? (
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      ) : documents.length === 0 ? (
        <AccountCard className="border-dashed text-center">
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        </AccountCard>
      ) : (
        <ul className="grid gap-3">
          {documents.map((doc) => (
            <li key={doc.id}>
              <AccountCard className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-[var(--logo-black)]">
                    {doc.file_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {copy.types[doc.document_type]} ·{" "}
                    {doc.deleted_at
                      ? copy.verification.deleted
                      : copy.verification[doc.verification_status]}
                  </p>
                  {doc.deleted_at ? (
                    <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                      <p>{copy.deletedOn.replace("{date}", formatDate(doc.deleted_at))}</p>
                      <p>{copy.deletedSecurely}</p>
                    </div>
                  ) : null}
                  {doc.verification_status === "rejected" && doc.deletion_reason ? (
                    <p className="mt-1 text-sm text-destructive">
                      {copy.rejectedReason}: {doc.deletion_reason}. {copy.reuploadGuidance}
                    </p>
                  ) : null}
                </div>
                {!doc.deleted_at ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete(doc.id)}
                    className="inline-flex size-10 items-center justify-center rounded-xl border border-black/10 text-destructive transition-colors hover:bg-destructive/5"
                    aria-label={copy.delete}
                  >
                    <Trash2 className="size-4" />
                  </button>
                ) : null}
              </AccountCard>
            </li>
          ))}
        </ul>
      )}
    </AccountContent>
  );
}
