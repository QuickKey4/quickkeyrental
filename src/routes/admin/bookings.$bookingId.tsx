import { createFileRoute } from "@tanstack/react-router";

import { AdminBookingDetailPage } from "@/features/admin/pages/booking-detail-page";
import { getMessages } from "@/i18n/messages";

export const Route = createFileRoute("/admin/bookings/$bookingId")({
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.admin.meta.bookingDetailTitle }],
    };
  },
  component: AdminBookingDetailRoute,
});

function AdminBookingDetailRoute() {
  const { bookingId } = Route.useParams();
  return <AdminBookingDetailPage bookingId={bookingId} />;
}
