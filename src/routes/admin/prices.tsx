import { createFileRoute } from "@tanstack/react-router";

import { AdminPricesPage } from "@/features/admin/pages/prices-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/prices")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.pricesTitle }],
    };
  },
  component: AdminPricesPage,
});
