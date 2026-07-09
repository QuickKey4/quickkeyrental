import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getAdminDocuments, getAdminDocumentUrl, updateAdminDocumentStatus } from "../api/admin.functions";
import { AdminBadge, AdminButton, AdminCard, AdminPageHeader } from "../components/admin-ui";
import { useAdminI18n } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";

export function AdminDocumentsPage() {
  const adminSecret = useAdminSecret();
  const { t, translateError } = useAdminI18n();
  const [documents, setDocuments] = useState<Awaited<ReturnType<typeof getAdminDocuments>>>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    if (!adminSecret) return;
    void getAdminDocuments({ data: { adminSecret } })
      .then(setDocuments)
      .finally(() => setLoading(false));
  };

  useEffect(load, [adminSecret]);

  const setStatus = async (documentId: string, status: "approved" | "rejected") => {
    if (!adminSecret) return;
    await updateAdminDocumentStatus({ data: { adminSecret, documentId, status } });
    load();
  };

  const openDocument = async (documentId: string, download = false) => {
    if (!adminSecret) return;
    setOpeningId(documentId);
    setError("");
    try {
      const { url, fileName } = await getAdminDocumentUrl({ data: { adminSecret, documentId } });
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
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t.documents.title} subtitle={t.documents.subtitle} />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.documents.loading}</p>
      ) : documents.length === 0 ? (
        <AdminCard>
          <p className="text-sm text-muted-foreground">{t.documents.empty}</p>
        </AdminCard>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <AdminCard key={doc.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{doc.file_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {doc.document_type.replace("_", " ")} · User {doc.user_id.slice(0, 8)}
                  </p>
                </div>
                <AdminBadge
                  tone={
                    doc.verification_status === "approved"
                      ? "green"
                      : doc.verification_status === "rejected"
                        ? "red"
                        : "amber"
                  }
                >
                  {doc.verification_status}
                </AdminBadge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <AdminButton
                  variant="secondary"
                  disabled={openingId === doc.id}
                  onClick={() => void openDocument(doc.id)}
                >
                  {t.view}
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  disabled={openingId === doc.id}
                  onClick={() => void openDocument(doc.id, true)}
                >
                  {t.download}
                </AdminButton>
                <AdminButton variant="primary" onClick={() => void setStatus(doc.id, "approved")}>
                  {t.approve}
                </AdminButton>
                <AdminButton variant="danger" onClick={() => void setStatus(doc.id, "rejected")}>
                  {t.reject}
                </AdminButton>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
