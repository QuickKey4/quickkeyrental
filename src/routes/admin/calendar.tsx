import { createFileRoute } from "@tanstack/react-router";

import { AdminCalendarPage } from "@/features/admin/pages/calendar-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/calendar")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.calendarTitle }],
    };
  },
  component: AdminCalendarPage,
});
