import { useEffect, useState } from "react";

import { getAdminCalendar } from "../api/admin.functions";
import { FleetCalendar } from "../components/fleet-calendar";
import { AdminButton, AdminPageHeader } from "../components/admin-ui";
import { useAdminI18n } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";
import { addDays, todayKey } from "../lib/admin-utils";

export function AdminCalendarPage() {
  const adminSecret = useAdminSecret();
  const { t } = useAdminI18n();
  const [startDate, setStartDate] = useState(todayKey());
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminCalendar>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminSecret) return;
    setLoading(true);
    void getAdminCalendar({ data: { adminSecret, startDate, days: 14 } })
      .then(setData)
      .finally(() => setLoading(false));
  }, [adminSecret, startDate]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t.calendar.title}
        subtitle={t.calendar.subtitle}
        action={
          <div className="flex gap-2">
            <AdminButton variant="secondary" onClick={() => setStartDate(addDays(startDate, -7))}>
              {t.calendar.prevWeek}
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => setStartDate(todayKey())}>
              {t.today}
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => setStartDate(addDays(startDate, 7))}>
              {t.calendar.nextWeek}
            </AdminButton>
          </div>
        }
      />

      {loading || !data ? (
        <p className="text-sm text-muted-foreground">{t.calendar.loading}</p>
      ) : (
        <FleetCalendar
          startDate={data.startDate}
          days={data.days}
          cars={data.cars}
          bookings={data.bookings}
        />
      )}
    </div>
  );
}
