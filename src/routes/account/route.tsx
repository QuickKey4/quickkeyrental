import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import { AccountLayout } from "@/features/account/account-layout";
import { RequireAuth } from "@/features/account/require-auth";

const PUBLIC_PATHS = new Set([
  "/account/login",
  "/account/register",
  "/account/forgot-password",
  "/account/reset-password",
]);

export const Route = createFileRoute("/account")({
  component: AccountRouteLayout,
});

function AccountRouteLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isPublic = PUBLIC_PATHS.has(pathname);

  return isPublic ? (
    <Outlet />
  ) : (
    <RequireAuth>
      <AccountLayout>
        <Outlet />
      </AccountLayout>
    </RequireAuth>
  );
}
