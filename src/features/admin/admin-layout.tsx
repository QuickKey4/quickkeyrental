import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AdminNav } from "./admin-nav";
import { useAdminI18n } from "./hooks/use-admin-i18n";

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const [open, setOpen] = useState(false);
  const { t } = useAdminI18n();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-[#f0f0ee]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-black/[0.06] bg-white lg:flex lg:flex-col">
        <div className="flex h-full min-h-0 flex-col px-4 pt-6 pb-4">
          <AdminNav />
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-black/[0.06] bg-white px-4 lg:hidden">
          <span className="text-sm font-bold text-[var(--logo-red)]">{t.layout.mobileTitle}</span>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-black/10"
            onClick={() => setOpen((v) => !v)}
            aria-label={t.layout.toggleMenu}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>

        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setOpen(false)}
              aria-label={t.layout.closeMenu}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-[280px] overflow-y-auto bg-white p-4 shadow-xl lg:hidden">
              <AdminNav onNavigate={() => setOpen(false)} />
            </div>
          </>
        ) : null}

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
