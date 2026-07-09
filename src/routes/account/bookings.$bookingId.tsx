import { createFileRoute } from "@tanstack/react-router";

import { ManageBookingPage } from "@/features/account/pages/manage-booking-page";
import { getMessages } from "@/i18n/messages";

type Search = {
  edit?: string;
};

export const Route = createFileRoute("/account/bookings/$bookingId")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  head: ({ match }) => {
    const messages = getMessages(match.context.locale);
    return {
      meta: [{ title: messages.account.meta.manageBookingTitle }],
    };
  },
  component: ManageBookingRoute,
});

function ManageBookingRoute() {
  const { bookingId } = Route.useParams();
  const { edit } = Route.useSearch();
  return <ManageBookingPage bookingId={bookingId} editMode={edit === "1"} />;
}
