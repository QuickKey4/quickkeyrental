import { createFileRoute } from "@tanstack/react-router";

import { AdminDiscountsPage } from "@/features/admin/pages/discounts-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/discounts")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.discountsTitle }],
    };
  },
  component: AdminDiscountsPage,
});
