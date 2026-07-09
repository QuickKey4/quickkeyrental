import { createFileRoute } from "@tanstack/react-router";

import { AdminLoginPage } from "@/features/admin/pages/login-page";
import { getMessages } from "@/i18n/messages";

type Search = {
  redirect?: string;
};

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.loginTitle }],
    };
  },
  component: AdminLoginRoute,
});

function AdminLoginRoute() {
  const { redirect } = Route.useSearch();
  return <AdminLoginPage redirect={redirect} />;
}
