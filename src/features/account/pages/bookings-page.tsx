import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

import { fetchUserBookings, type BookingWithCar } from "../account-queries";
import {
  isCancelledBooking,
  isPastBooking,
  isUpcomingBooking,
  sortUpcomingBookings,
} from "../account-utils";
import { linkBookingsToUser } from "../auth";
import { useAuth } from "../auth-provider";
import { AccountContent } from "../account-layout";
import { AccountPageHeader } from "../components/account-ui";
import { BookingListCard } from "../components/history-booking-card";
import { CancelBookingDialog } from "../components/cancel-booking-dialog";
import { useCancelBookingFlow } from "../hooks/use-cancel-booking-flow";

type Tab = "upcoming" | "completed" | "cancelled";

export function BookingsPage() {
  const { messages } = useI18n();
  const { user } = useAuth();
  const copy = messages.account.bookings;

  const [tab, setTab] = useState<Tab>("upcoming");
  const [bookings, setBookings] = useState<BookingWithCar[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await linkBookingsToUser();
      setBookings(await fetchUserBookings());
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const cancelFlow = useCancelBookingFlow(loadBookings, copy.cancelError);

  const filtered = useMemo(() => {
    if (tab === "cancelled") {
      return bookings.filter((booking) => isCancelledBooking(booking));
    }
    if (tab === "completed") {
      return bookings.filter((booking) => isPastBooking(booking));
    }
    return sortUpcomingBookings(bookings.filter((booking) => isUpcomingBooking(booking)));
  }, [bookings, tab]);

  const emptyCopy =
    tab === "upcoming"
      ? copy.emptyUpcoming
      : tab === "completed"
        ? copy.emptyCompleted
        : copy.emptyCancelled;

  const tabs: { id: Tab; label: string }[] = [
    { id: "upcoming", label: copy.tabs.upcoming },
    { id: "completed", label: copy.tabs.completed },
    { id: "cancelled", label: copy.tabs.cancelled },
  ];

  return (
    <AccountContent className="space-y-6">
      <AccountPageHeader title={copy.title} subtitle={copy.subtitle} />

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "min-h-11 rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
              tab === item.id
                ? "bg-[var(--logo-red)] text-white shadow-[0_6px_16px_rgba(232,40,46,0.25)]"
                : "border border-black/10 bg-white text-[var(--logo-black)] hover:bg-black/[0.03]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-black/10 bg-white p-12 text-center text-sm text-muted-foreground">
          {emptyCopy}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <BookingListCard
              key={booking.id}
              booking={booking}
              showActions={tab === "upcoming"}
              onCancel={tab === "upcoming" ? cancelFlow.requestCancel : undefined}
              cancellingId={cancelFlow.loading ? (cancelFlow.target?.id ?? null) : null}
            />
          ))}
        </div>
      )}

      <CancelBookingDialog
        booking={cancelFlow.target}
        open={cancelFlow.open}
        onOpenChange={cancelFlow.setOpen}
        onConfirm={cancelFlow.confirmCancel}
        loading={cancelFlow.loading}
        error={cancelFlow.error}
      />
    </AccountContent>
  );
}
