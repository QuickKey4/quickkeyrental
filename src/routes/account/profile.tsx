import { createFileRoute } from "@tanstack/react-router";

import { ProfilePage } from "@/features/account/pages/profile-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/account/profile")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.account.meta.profileTitle }],
    };
  },
  component: ProfilePage,
});
