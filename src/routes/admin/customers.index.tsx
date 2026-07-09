import { createFileRoute } from "@tanstack/react-router";

import { AdminCustomersPage } from "@/features/admin/pages/customers-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/customers/")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.customersTitle }],
    };
  },
  component: AdminCustomersPage,
});
