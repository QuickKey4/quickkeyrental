import { createFileRoute } from "@tanstack/react-router";

import { BookingsPage } from "@/features/account/pages/bookings-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/account/bookings/")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.account.meta.bookingsTitle }],
    };
  },
  component: BookingsPage,
});
