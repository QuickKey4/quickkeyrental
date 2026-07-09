import { createFileRoute } from "@tanstack/react-router";

import { AdminCustomerDetailPage } from "@/features/admin/pages/customer-detail-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/customers/$email")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.customerDetailTitle }],
    };
  },
  component: AdminCustomerDetailRoute,
});

function AdminCustomerDetailRoute() {
  const { email } = Route.useParams();
  return <AdminCustomerDetailPage email={email} />;
}
