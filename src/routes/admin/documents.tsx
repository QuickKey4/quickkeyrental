import { createFileRoute } from "@tanstack/react-router";

import { AdminDocumentsPage } from "@/features/admin/pages/documents-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/documents")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.documentsTitle }],
    };
  },
  component: AdminDocumentsPage,
});
