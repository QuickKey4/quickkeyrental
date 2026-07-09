import { createFileRoute } from "@tanstack/react-router";

import { DriversPage } from "@/features/account/pages/drivers-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/account/drivers")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.account.meta.driversTitle }],
    };
  },
  component: DriversPage,
});
