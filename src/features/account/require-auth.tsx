import { useRouterState, Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useAuth } from "./auth-provider";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[var(--logo-red)] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    const redirect = `${pathname}${searchStr}`;
    return <Navigate to="/account/login" search={{ redirect }} replace />;
  }

  return children;
}
