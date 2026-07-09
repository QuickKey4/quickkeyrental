import { createFileRoute } from "@tanstack/react-router";

import { AdminSupportPage } from "@/features/admin/pages/support-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/support")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.supportTitle }],
    };
  },
  component: AdminSupportPage,
});
