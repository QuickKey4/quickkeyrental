import { createFileRoute } from "@tanstack/react-router";

import { AdminFleetPage } from "@/features/admin/pages/fleet-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/fleet")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.fleetTitle }],
    };
  },
  component: AdminFleetPage,
});
