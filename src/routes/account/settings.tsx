import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/features/account/pages/settings-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/account/settings")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.account.meta.settingsTitle }],
    };
  },
  component: SettingsPage,
});
