import { createFileRoute } from "@tanstack/react-router";

import { AdminBookingsPage } from "@/features/admin/pages/bookings-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/bookings/")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.bookingsTitle }],
    };
  },
  component: AdminBookingsPage,
});
