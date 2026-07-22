import { createFileRoute } from "@tanstack/react-router";

import { RewardsPage } from "@/features/account/pages/rewards-page";

export const Route = createFileRoute("/account/rewards")({
  head: ({ match }) => {
    const messages = match.context.messages;
    return {
      meta: [{ title: messages.account.meta.rewardsTitle }],
    };
  },
  component: RewardsPage,
});
