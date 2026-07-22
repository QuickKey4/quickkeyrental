import { Link } from "@tanstack/react-router";
import { CalendarPlus, Car, CheckCircle2, FileText, MessageCircle, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/i18n/provider";

import { fetchUserBookings, type BookingWithCar } from "../account-queries";
import { isPastBooking, isUpcomingBooking, sortUpcomingBookings } from "../account-utils";
import { linkBookingsToUser } from "../auth";
import { useAuth } from "../auth-provider";
import { AccountDashboardGrid } from "../account-layout";
import { AccountCard, AccountPageHeader, AccountSectionTitle } from "../components/account-ui";
import { AccountSidebarWidgets } from "../components/account-sidebar-widgets";
import { CancelBookingDialog } from "../components/cancel-booking-dialog";
import { HistoryBookingCard } from "../components/history-booking-card";
import { UpcomingBookingCard } from "../components/upcoming-booking-card";
import { useCancelBookingFlow } from "../hooks/use-cancel-booking-flow";

export function DashboardPage() {
  const { messages } = useI18n();
  const { user, profile } = useAuth();
  const copy = messages.account.dashboard;

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

  const upcoming = useMemo(
    () => sortUpcomingBookings(bookings.filter((booking) => isUpcomingBooking(booking)))[0],
    [bookings],
  );

  const pastRentals = useMemo(
    () => bookings.filter((booking) => isPastBooking(booking)).slice(0, 4),
    [bookings],
  );

  const firstName = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? copy.guest;
  const cancelFlow = useCancelBookingFlow(loadBookings, messages.account.bookings.cancelError);

  return (
    <AccountDashboardGrid
      main={
        <>
          <AccountPageHeader
            eyebrow={copy.eyebrow}
            title={copy.welcomeBack.replace("{name}", firstName)}
            subtitle={copy.subtitle}
          />

          {loading ? (
            <p className="text-sm text-muted-foreground">{copy.loading}</p>
          ) : upcoming ? (
            <UpcomingBookingCard
              booking={upcoming}
              onCancel={cancelFlow.requestCancel}
              cancellingId={cancelFlow.loading ? (cancelFlow.target?.id ?? null) : null}
            />
          ) : (
            <AccountCard className="border-dashed text-center">
              <p className="text-sm text-muted-foreground">{copy.noUpcoming}</p>
              <Link
                to="/book"
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--logo-red)] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(232,40,46,0.22)] hover:bg-[#c92228]"
              >
                <CalendarPlus className="size-4" />
                {copy.bookNow}
              </Link>
            </AccountCard>
          )}

          <section>
            <AccountSectionTitle title={copy.quickActions} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickAction to="/account/bookings" icon={Car} label={copy.actions.bookings} />
              <QuickAction to="/account/documents" icon={FileText} label={copy.actions.documents} />
              <QuickAction to="/account/profile" icon={User} label={copy.actions.profile} />
              <QuickAction
                to="/account/support"
                icon={MessageCircle}
                label={copy.actions.whatsapp}
              />
            </div>
          </section>

          <section>
            <AccountSectionTitle title={copy.nextStepsTitle} />
            <div className="grid gap-3 sm:grid-cols-3">
              <NextStepCard
                icon={CheckCircle2}
                title={copy.nextSteps.confirmedTitle}
                body={copy.nextSteps.confirmedBody}
              />
              <NextStepCard
                icon={FileText}
                title={copy.nextSteps.documentsTitle}
                body={copy.nextSteps.documentsBody}
              />
              <NextStepCard
                icon={MessageCircle}
                title={copy.nextSteps.supportTitle}
                body={copy.nextSteps.supportBody}
              />
            </div>
          </section>

          {pastRentals.length > 0 ? (
            <section>
              <AccountSectionTitle
                title={copy.pastRentalsTitle}
                action={
                  <Link
                    to="/account/bookings"
                    className="text-sm font-semibold text-[var(--logo-red)] hover:underline"
                  >
                    {copy.viewAll}
                  </Link>
                }
              />
              <div className="space-y-4">
                {pastRentals.map((booking) => (
                  <HistoryBookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          ) : null}

          <CancelBookingDialog
            booking={cancelFlow.target}
            open={cancelFlow.open}
            onOpenChange={cancelFlow.setOpen}
            onConfirm={cancelFlow.confirmCancel}
            loading={cancelFlow.loading}
            error={cancelFlow.error}
          />
        </>
      }
      sidebar={<AccountSidebarWidgets bookingCount={bookings.length} />}
    />
  );
}

function NextStepCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_2px_12px_rgba(16,16,16,0.04)]">
      <span className="inline-grid size-10 place-items-center rounded-2xl bg-[var(--logo-red)]/10 text-[var(--logo-red)]">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-3 text-sm font-bold text-[var(--logo-black)]">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 text-center shadow-[0_2px_12px_rgba(16,16,16,0.04)] transition-all hover:-translate-y-0.5 hover:border-[var(--logo-red)]/20 hover:bg-white hover:shadow-[0_8px_24px_rgba(16,16,16,0.08)]"
    >
      <span className="inline-grid size-12 place-items-center rounded-2xl bg-[var(--logo-red)]/10 text-[var(--logo-red)] transition-colors group-hover:bg-[var(--logo-red)] group-hover:text-white">
        <Icon className="size-5" />
      </span>
      <span className="text-xs font-semibold leading-tight text-[var(--logo-black)]">{label}</span>
    </Link>
  );
}
