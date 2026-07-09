import { createFileRoute } from "@tanstack/react-router";

import { SupportPage } from "@/features/account/pages/support-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/account/support")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.account.meta.supportTitle }],
    };
  },
  component: SupportPage,
});
