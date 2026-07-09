import { createFileRoute } from "@tanstack/react-router";

import { DocumentsPage } from "@/features/account/pages/documents-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/account/documents")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.account.meta.documentsTitle }],
    };
  },
  component: DocumentsPage,
});
