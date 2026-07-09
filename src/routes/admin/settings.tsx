import { createFileRoute } from "@tanstack/react-router";

import { AdminSettingsPage } from "@/features/admin/pages/settings-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/settings")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.settingsTitle }],
    };
  },
  component: AdminSettingsPage,
});
