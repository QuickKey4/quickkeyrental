import { Navigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useAdminAuth } from "./admin-auth-provider";

type RequireAdminProps = {
  children: ReactNode;
};

export function RequireAdmin({ children }: RequireAdminProps) {
  const { isAuthenticated, ready } = useAdminAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f0ee]">
        <div className="size-8 animate-spin rounded-full border-2 border-[var(--logo-red)] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = `${pathname}${searchStr}`;
    return <Navigate to="/admin/login" search={{ redirect }} replace />;
  }

  return children;
}
