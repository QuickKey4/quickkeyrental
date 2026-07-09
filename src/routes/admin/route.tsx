import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import { AdminAuthProvider } from "@/features/admin/admin-auth-provider";
import { AdminLayout } from "@/features/admin/admin-layout";
import { RequireAdmin } from "@/features/admin/require-admin";

const PUBLIC_PATHS = new Set(["/admin/login"]);

export const Route = createFileRoute("/admin")({
  component: AdminRouteLayout,
});

function AdminRouteLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isPublic = PUBLIC_PATHS.has(pathname);

  return (
    <AdminAuthProvider>
      {isPublic ? (
        <Outlet />
      ) : (
        <RequireAdmin>
          <AdminLayout>
            <Outlet />
          </AdminLayout>
        </RequireAdmin>
      )}
    </AdminAuthProvider>
  );
}
