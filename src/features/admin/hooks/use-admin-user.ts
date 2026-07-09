import { useAdminAuth } from "../admin-auth-provider";

export function useAdminSecret(): string | null {
  const { secret, isAuthenticated } = useAdminAuth();
  return isAuthenticated ? secret : null;
}
