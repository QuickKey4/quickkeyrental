import { createFileRoute } from "@tanstack/react-router";

import { AdminPaymentsPage } from "@/features/admin/pages/payments-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/payments")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.paymentsTitle }],
    };
  },
  component: AdminPaymentsPage,
});
