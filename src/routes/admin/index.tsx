import { createFileRoute } from "@tanstack/react-router";

import { AdminDashboardPage } from "@/features/admin/pages/dashboard-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.dashboardTitle }],
    };
  },
  component: AdminDashboardPage,
});
