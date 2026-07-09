import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/features/account/pages/login-page";
import { getMessages } from "@/i18n/messages";

type Search = {
  redirect?: string;
};

export const Route = createFileRoute("/account/login")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [
        { title: messages.account.meta.loginTitle },
        { name: "description", content: messages.account.meta.loginDescription },
      ],
    };
  },
  component: LoginPage,
});
