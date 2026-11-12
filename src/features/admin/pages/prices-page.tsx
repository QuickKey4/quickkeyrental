import { useEffect, useMemo, useState } from "react";
import { DollarSign } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/brand";
import { interpolate } from "@/i18n/interpolate";
import type { RatePeriodScope } from "@/lib/pricing.server";
import { cn } from "@/lib/utils";

import {
  createAdminRatePeriod,
  endAdminRatePeriod,
  getAdminRatePeriods,
  type AdminDiscountPreviewCar,
  type AdminRatePeriod,
} from "../api/admin.functions";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminField,
  AdminPageHeader,
  adminInputClassName,
} from "../components/admin-ui";
import { useAdminI18n } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";
import { formatAdminShortDate } from "../lib/admin-utils";

const SCOPES: Exclude<RatePeriodScope, "car">[] = ["all", "compact", "sedan"];

function carMatchesScope(car: AdminDiscountPreviewCar, scope: RatePeriodScope) {
  if (scope === "all") return true;
  return car.scope === scope;
}

function formatDateRange(startsAt: string, endsAt: string, intlLocale: string) {
  return `${formatAdminShortDate(startsAt.slice(0, 10), intlLocale)} → ${formatAdminShortDate(
    endsAt.slice(0, 10),
    intlLocale,
  )}`;
}

export function AdminPricesPage() {
  const adminSecret = useAdminSecret();
  const { t, intlLocale, translateError } = useAdminI18n();
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminRatePeriods>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEnded, setShowEnded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [dailyPrice, setDailyPrice] = useState("75");
  const [scope, setScope] = useState<Exclude<RatePeriodScope, "car">>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const load = () => {
    if (!adminSecret) return;
    setLoading(true);
    void getAdminRatePeriods({ data: { adminSecret } })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(load, [adminSecret]);

  const parsedPrice = Number.parseFloat(dailyPrice);
  const preview = useMemo(() => {
    if (!data || !Number.isFinite(parsedPrice) || parsedPrice <= 0) return [];
    return data.previewCars
      .filter((car) => carMatchesScope(car, scope))
      .map((car) => ({
        ...car,
        seasonal: Math.round(parsedPrice),
      }));
  }, [data, scope, parsedPrice]);

  const resetForm = () => {
    setName("");
    setDailyPrice("75");
    setScope("all");
    setCustomStart("");
    setCustomEnd("");
    setError(null);
  };

  const submit = async () => {
    if (!adminSecret) return;
    setError(null);
    if (!name.trim()) {
      setError(t.prices.errors.nameRequired);
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError(t.prices.errors.amountInvalid);
      return;
    }
    if (!customStart || !customEnd) {
      setError(t.prices.errors.datesRequired);
      return;
    }

    const startsAt = new Date(`${customStart}T00:00:00`).toISOString();
    const endsAt = new Date(`${customEnd}T23:59:59`).toISOString();
    setSaving(true);
    try {
      await createAdminRatePeriod({
        data: {
          adminSecret,
          name: name.trim(),
          dailyPrice: parsedPrice,
          scope,
          startsAt,
          endsAt,
        },
      });
      setFormOpen(false);
      resetForm();
      load();
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : ""));
    } finally {
      setSaving(false);
    }
  };

  const endPeriod = async (ratePeriodId: string) => {
    if (!adminSecret) return;
    setEndingId(ratePeriodId);
    try {
      await endAdminRatePeriod({ data: { adminSecret, ratePeriodId } });
      load();
    } finally {
      setEndingId(null);
    }
  };

  if (loading || !data) {
    return <p className="text-sm text-muted-foreground">{t.prices.loading}</p>;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t.prices.title}
        subtitle={t.prices.subtitle}
        action={
          <AdminButton onClick={() => setFormOpen(true)}>
            <DollarSign className="mr-2 size-4" />
            {t.prices.newPeriod}
          </AdminButton>
        }
      />

      <AdminCard>
        <p className="text-sm text-muted-foreground">{t.prices.lockNote}</p>
      </AdminCard>

      <RateSection
        title={interpolate(t.prices.activeSection, { count: String(data.active.length) })}
        empty={t.prices.noActive}
        periods={data.active}
        intlLocale={intlLocale}
        t={t}
        onEnd={endPeriod}
        endingId={endingId}
      />

      <RateSection
        title={interpolate(t.prices.scheduledSection, { count: String(data.scheduled.length) })}
        empty={t.prices.noScheduled}
        periods={data.scheduled}
        intlLocale={intlLocale}
        t={t}
        onEnd={endPeriod}
        endingId={endingId}
      />

      <AdminCard>
        <button
          type="button"
          onClick={() => setShowEnded((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <h2 className="font-display text-lg font-bold">
            {interpolate(t.prices.endedSection, { count: String(data.ended.length) })}
          </h2>
          <span className="text-sm text-muted-foreground">{showEnded ? "−" : "+"}</span>
        </button>
        {showEnded ? (
          <div className="mt-4 space-y-3">
            {data.ended.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.prices.noEnded}</p>
            ) : (
              data.ended.map((period) => (
                <RateRow
                  key={period.id}
                  period={period}
                  intlLocale={intlLocale}
                  t={t}
                  onEnd={endPeriod}
                  endingId={endingId}
                  showEnd={false}
                />
              ))
            )}
          </div>
        ) : null}
      </AdminCard>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.prices.formTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <AdminField label={t.prices.fields.name}>
              <input
                className={adminInputClassName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.prices.fields.namePlaceholder}
              />
            </AdminField>

            <AdminField label={t.prices.fields.dailyPrice}>
              <input
                type="number"
                min={1}
                step={1}
                className={adminInputClassName}
                value={dailyPrice}
                onChange={(e) => setDailyPrice(e.target.value)}
              />
            </AdminField>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.prices.fields.scope}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SCOPES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setScope(item)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      scope === item
                        ? "bg-[var(--logo-red)] text-white"
                        : "bg-black/[0.05] text-foreground hover:bg-black/[0.08]",
                    )}
                  >
                    {t.prices.scope[item]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label={t.prices.fields.startDate}>
                <input
                  type="date"
                  className={adminInputClassName}
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </AdminField>
              <AdminField label={t.prices.fields.endDate}>
                <input
                  type="date"
                  className={adminInputClassName}
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </AdminField>
            </div>

            {preview.length > 0 ? (
              <AdminCard>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.prices.previewTitle}
                </p>
                <ul className="mt-3 space-y-2">
                  {preview.map((car) => (
                    <li key={car.fleetKey || car.name} className="flex justify-between text-sm">
                      <span>{car.name}</span>
                      <span className="font-medium">
                        {car.basePrice !== car.seasonal ? (
                          <span className="mr-2 text-muted-foreground line-through">
                            {formatPrice(car.basePrice, intlLocale)}
                          </span>
                        ) : null}
                        {formatPrice(car.seasonal, intlLocale)}
                        <span className="text-muted-foreground"> / day</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </AdminCard>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex gap-2">
              <AdminButton className="flex-1" onClick={() => void submit()} disabled={saving}>
                {saving ? t.prices.saving : t.prices.save}
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setFormOpen(false)}>
                {t.cancel}
              </AdminButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RateSection({
  title,
  empty,
  periods,
  intlLocale,
  t,
  onEnd,
  endingId,
}: {
  title: string;
  empty: string;
  periods: AdminRatePeriod[];
  intlLocale: string;
  t: ReturnType<typeof useAdminI18n>["t"];
  onEnd: (id: string) => void;
  endingId: string | null;
}) {
  return (
    <AdminCard>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-3">
        {periods.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          periods.map((period) => (
            <RateRow
              key={period.id}
              period={period}
              intlLocale={intlLocale}
              t={t}
              onEnd={onEnd}
              endingId={endingId}
            />
          ))
        )}
      </div>
    </AdminCard>
  );
}

function RateRow({
  period,
  intlLocale,
  t,
  onEnd,
  endingId,
  showEnd = true,
}: {
  period: AdminRatePeriod;
  intlLocale: string;
  t: ReturnType<typeof useAdminI18n>["t"];
  onEnd: (id: string) => void;
  endingId: string | null;
  showEnd?: boolean;
}) {
  const tone =
    period.status === "active" ? "green" : period.status === "scheduled" ? "blue" : "neutral";
  const scopeLabel =
    period.scope === "all"
      ? t.prices.scope.all
      : period.scope === "compact"
        ? t.prices.scope.compact
        : period.scope === "sedan"
          ? t.prices.scope.sedan
          : t.prices.scope.car;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/[0.05] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{period.name}</p>
          <AdminBadge tone={tone}>{t.prices.status[period.status]}</AdminBadge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatPrice(period.daily_price, intlLocale)} / day · {scopeLabel}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDateRange(period.starts_at, period.ends_at, intlLocale)}
        </p>
      </div>
      {showEnd && period.status !== "ended" ? (
        <AdminButton
          variant="secondary"
          disabled={endingId === period.id}
          onClick={() => onEnd(period.id)}
        >
          {endingId === period.id ? t.prices.ending : t.prices.endNow}
        </AdminButton>
      ) : null}
    </div>
  );
}
