import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/features/account/pages/dashboard-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/account/")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [
        { title: messages.account.meta.dashboardTitle },
        { name: "description", content: messages.account.meta.dashboardDescription },
      ],
    };
  },
  component: DashboardPage,
});
