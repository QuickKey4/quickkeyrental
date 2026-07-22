import { createFileRoute } from "@tanstack/react-router";

import { AdminRewardsPage } from "@/features/admin/pages/rewards-page";

export const Route = createFileRoute("/admin/rewards")({
  head: ({ match }) => {
    const messages = match.context.messages;
    return {
      meta: [{ title: messages.admin.meta.rewardsTitle }],
    };
  },
  component: AdminRewardsPage,
});
