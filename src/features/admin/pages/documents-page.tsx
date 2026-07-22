import { useCallback, useEffect, useState } from "react";

import { getAdminDocuments } from "../api/admin.functions";
import { AdminButton, AdminCard, AdminPageHeader } from "../components/admin-ui";
import { AdminDocumentCard } from "../components/admin-document-card";
import { useAdminI18n } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";

type DocumentResponse = Awaited<ReturnType<typeof getAdminDocuments>>;
type DocumentStatusFilter = "pending" | "approved" | "rejected" | "deleted" | "all";
type DocumentSort = "newest" | "oldest_pending" | "pickup_date" | "customer_name";

const statusFilters: DocumentStatusFilter[] = ["pending", "approved", "rejected", "deleted", "all"];
const sortOptions: DocumentSort[] = ["newest", "oldest_pending", "pickup_date", "customer_name"];

export function AdminDocumentsPage() {
  const adminSecret = useAdminSecret();
  const { t } = useAdminI18n();
  const [response, setResponse] = useState<DocumentResponse>({
    documents: [],
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 1,
  });
  const [status, setStatus] = useState<DocumentStatusFilter>("pending");
  const [sort, setSort] = useState<DocumentSort>("oldest_pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!adminSecret) return;
    setLoading(true);
    void getAdminDocuments({
      data: { adminSecret, status, sort, search: search || undefined, page, pageSize: 12 },
    })
      .then(setResponse)
      .finally(() => setLoading(false));
  }, [adminSecret, page, search, sort, status]);

  useEffect(load, [load]);

  const updateStatus = (next: DocumentStatusFilter) => {
    setStatus(next);
    setSort(next === "pending" ? "oldest_pending" : "newest");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t.documents.title} subtitle={t.documents.subtitle} />

      <AdminCard>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => updateStatus(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                status === item
                  ? "bg-[var(--logo-red)] text-white shadow-[0_10px_24px_rgba(239,43,50,0.22)]"
                  : "bg-black/[0.04] text-muted-foreground hover:bg-black/[0.07]"
              }`}
            >
              {t.documents.filters[item]}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_260px]">
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t.documents.searchPlaceholder}
            className="h-12 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-[var(--logo-red)]"
          />
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as DocumentSort);
              setPage(1);
            }}
            className="h-12 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-[var(--logo-red)]"
          >
            {sortOptions.map((item) => (
              <option key={item} value={item}>
                {t.documents.sort[item]}
              </option>
            ))}
          </select>
        </div>
      </AdminCard>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.documents.loading}</p>
      ) : response.documents.length === 0 ? (
        <AdminCard>
          <p className="text-sm text-muted-foreground">{t.documents.empty}</p>
        </AdminCard>
      ) : (
        <>
          <div className="grid gap-4">
            {response.documents.map((doc) => (
              <AdminDocumentCard
                key={doc.id}
                doc={doc}
                adminSecret={adminSecret}
                onChanged={load}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t.documents.resultCount
                .replace("{count}", String(response.total))
                .replace("{page}", String(response.page))
                .replace("{totalPages}", String(response.totalPages))}
            </p>
            <div className="flex gap-2">
              <AdminButton
                variant="secondary"
                disabled={response.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {t.previous}
              </AdminButton>
              <AdminButton
                variant="secondary"
                disabled={response.page >= response.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                {t.next}
              </AdminButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
