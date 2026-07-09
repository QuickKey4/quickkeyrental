import { useEffect, useMemo, useState } from "react";
import { Tag } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/brand";
import { interpolate } from "@/i18n/interpolate";
import type { DiscountScope, DiscountType } from "@/lib/pricing.server";
import { cn } from "@/lib/utils";

import {
  createAdminDiscount,
  endAdminDiscount,
  getAdminDiscounts,
  type AdminDiscount,
  type AdminDiscountPreviewCar,
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

type DurationPreset = "week" | "month" | "quarter" | "year" | "custom";

const DURATION_PRESETS: DurationPreset[] = ["week", "month", "quarter", "year", "custom"];
const SCOPES: DiscountScope[] = ["all", "compact", "sedan"];

function previewEffectivePrice(
  base: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  const raw =
    discountType === "percent"
      ? base * (1 - discountValue / 100)
      : base - discountValue;
  return Math.max(0, Math.round(raw));
}

function carMatchesScope(car: AdminDiscountPreviewCar, scope: DiscountScope) {
  if (scope === "all") return true;
  return car.scope === scope;
}

function presetRange(preset: DurationPreset, customStart: string, customEnd: string) {
  if (preset === "custom") {
    return {
      startsAt: new Date(`${customStart}T00:00:00`).toISOString(),
      endsAt: new Date(`${customEnd}T23:59:59`).toISOString(),
    };
  }
  const start = new Date();
  start.setSeconds(0, 0);
  const end = new Date(start);
  if (preset === "week") end.setDate(end.getDate() + 7);
  if (preset === "month") end.setDate(end.getDate() + 30);
  if (preset === "quarter") end.setDate(end.getDate() + 90);
  if (preset === "year") end.setDate(end.getDate() + 365);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

function formatDateRange(startsAt: string, endsAt: string, intlLocale: string) {
  const fmt = new Intl.DateTimeFormat(intlLocale, { month: "short", day: "numeric" });
  return `${fmt.format(new Date(startsAt))} → ${fmt.format(new Date(endsAt))}`;
}

export function AdminDiscountsPage() {
  const adminSecret = useAdminSecret();
  const { t, intlLocale } = useAdminI18n();
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminDiscounts>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEnded, setShowEnded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("fixed_amount");
  const [discountValue, setDiscountValue] = useState("10");
  const [scope, setScope] = useState<DiscountScope>("compact");
  const [durationPreset, setDurationPreset] = useState<DurationPreset>("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const load = () => {
    if (!adminSecret) return;
    setLoading(true);
    void getAdminDiscounts({ data: { adminSecret } })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(load, [adminSecret]);

  const parsedValue = Number.parseFloat(discountValue);
  const preview = useMemo(() => {
    if (!data || !Number.isFinite(parsedValue) || parsedValue <= 0) return [];
    return data.previewCars
      .filter((car) => carMatchesScope(car, scope))
      .map((car) => ({
        ...car,
        effective: previewEffectivePrice(car.basePrice, discountType, parsedValue),
      }));
  }, [data, scope, discountType, parsedValue]);

  const resetForm = () => {
    setName("");
    setDiscountType("fixed_amount");
    setDiscountValue("10");
    setScope("compact");
    setDurationPreset("week");
    setCustomStart("");
    setCustomEnd("");
    setError(null);
  };

  const submit = async () => {
    if (!adminSecret) return;
    setError(null);
    if (!name.trim()) {
      setError(t.discounts.errors.nameRequired);
      return;
    }
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      setError(t.discounts.errors.amountInvalid);
      return;
    }
    if (durationPreset === "custom" && (!customStart || !customEnd)) {
      setError(t.discounts.errors.datesRequired);
      return;
    }

    const { startsAt, endsAt } = presetRange(durationPreset, customStart, customEnd);
    setSaving(true);
    try {
      await createAdminDiscount({
        data: {
          adminSecret,
          name: name.trim(),
          discountType,
          discountValue: parsedValue,
          scope,
          startsAt,
          endsAt,
        },
      });
      setFormOpen(false);
      resetForm();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errors.fallback);
    } finally {
      setSaving(false);
    }
  };

  const endDiscount = async (discountId: string) => {
    if (!adminSecret) return;
    setEndingId(discountId);
    try {
      await endAdminDiscount({ data: { adminSecret, discountId } });
      load();
    } finally {
      setEndingId(null);
    }
  };

  if (loading || !data) {
    return <p className="text-sm text-muted-foreground">{t.discounts.loading}</p>;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t.discounts.title}
        subtitle={t.discounts.subtitle}
        action={
          <AdminButton onClick={() => setFormOpen(true)}>
            <Tag className="mr-2 size-4" />
            {t.discounts.newDiscount}
          </AdminButton>
        }
      />

      <DiscountSection
        title={interpolate(t.discounts.activeSection, { count: String(data.active.length) })}
        empty={t.discounts.noActive}
        discounts={data.active}
        intlLocale={intlLocale}
        t={t}
        onEnd={endDiscount}
        endingId={endingId}
      />

      <DiscountSection
        title={interpolate(t.discounts.scheduledSection, { count: String(data.scheduled.length) })}
        empty={t.discounts.noScheduled}
        discounts={data.scheduled}
        intlLocale={intlLocale}
        t={t}
        onEnd={endDiscount}
        endingId={endingId}
      />

      <AdminCard>
        <button
          type="button"
          onClick={() => setShowEnded((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <h2 className="font-display text-lg font-bold">
            {interpolate(t.discounts.endedSection, { count: String(data.ended.length) })}
          </h2>
          <span className="text-sm text-muted-foreground">{showEnded ? "−" : "+"}</span>
        </button>
        {showEnded ? (
          <div className="mt-4 space-y-3">
            {data.ended.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.discounts.noEnded}</p>
            ) : (
              data.ended.map((d) => (
                <DiscountRow
                  key={d.id}
                  discount={d}
                  intlLocale={intlLocale}
                  t={t}
                  onEnd={endDiscount}
                  endingId={endingId}
                  showEnd={false}
                />
              ))
            )}
          </div>
        ) : null}
      </AdminCard>

      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.discounts.formTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <AdminField label={t.discounts.fields.name}>
              <input
                className={adminInputClassName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.discounts.fields.namePlaceholder}
              />
            </AdminField>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.discounts.fields.discountType}
              </p>
              <div className="mt-2 flex gap-2">
                {(["percent", "fixed_amount"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDiscountType(type)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      discountType === type
                        ? "bg-[var(--logo-red)] text-white"
                        : "bg-black/[0.05] text-foreground hover:bg-black/[0.08]",
                    )}
                  >
                    {type === "percent" ? t.discounts.fields.percent : t.discounts.fields.perDay}
                  </button>
                ))}
              </div>
            </div>

            <AdminField
              label={
                discountType === "percent"
                  ? t.discounts.fields.percentAmount
                  : t.discounts.fields.dollarAmount
              }
            >
              <input
                type="number"
                min={0}
                step={discountType === "percent" ? 1 : 1}
                className={adminInputClassName}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </AdminField>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.discounts.fields.appliesTo}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SCOPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      scope === s
                        ? "bg-[var(--logo-red)] text-white"
                        : "bg-black/[0.05] text-foreground hover:bg-black/[0.08]",
                    )}
                  >
                    {t.discounts.scopes[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.discounts.fields.duration}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDurationPreset(preset)}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                      durationPreset === preset
                        ? "bg-[var(--logo-black)] text-white"
                        : "bg-black/[0.05] text-foreground hover:bg-black/[0.08]",
                    )}
                  >
                    {t.discounts.durations[preset]}
                  </button>
                ))}
              </div>
            </div>

            {durationPreset === "custom" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label={t.discounts.fields.startDate}>
                  <input
                    type="date"
                    className={adminInputClassName}
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </AdminField>
                <AdminField label={t.discounts.fields.endDate}>
                  <input
                    type="date"
                    className={adminInputClassName}
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </AdminField>
              </div>
            ) : null}

            <AdminCard className="bg-[#fafafa]">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.discounts.preview}
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {preview.map((row) => (
                  <li key={row.fleetKey} className="flex items-center justify-between gap-3">
                    <span>{row.name}</span>
                    <span>
                      {formatPrice(row.basePrice, intlLocale)} →{" "}
                      <strong className="text-[var(--logo-red)]">
                        {formatPrice(row.effective, intlLocale)}
                        {t.discounts.perDaySuffix}
                      </strong>
                    </span>
                  </li>
                ))}
                {data.previewCars
                  .filter((car) => !carMatchesScope(car, scope))
                  .map((row) => (
                    <li
                      key={`unchanged-${row.fleetKey}`}
                      className="flex items-center justify-between gap-3 text-muted-foreground"
                    >
                      <span>{row.name}</span>
                      <span>{t.discounts.unchanged}</span>
                    </li>
                  ))}
              </ul>
            </AdminCard>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex gap-2">
              <AdminButton className="flex-1" onClick={() => void submit()} disabled={saving}>
                {saving ? t.discounts.applying : t.discounts.apply}
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

function DiscountSection({
  title,
  empty,
  discounts,
  intlLocale,
  t,
  onEnd,
  endingId,
}: {
  title: string;
  empty: string;
  discounts: AdminDiscount[];
  intlLocale: string;
  t: ReturnType<typeof useAdminI18n>["t"];
  onEnd: (id: string) => void;
  endingId: string | null;
}) {
  return (
    <AdminCard>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-3">
        {discounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          discounts.map((d) => (
            <DiscountRow
              key={d.id}
              discount={d}
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

function DiscountRow({
  discount,
  intlLocale,
  t,
  onEnd,
  endingId,
  showEnd = true,
}: {
  discount: AdminDiscount;
  intlLocale: string;
  t: ReturnType<typeof useAdminI18n>["t"];
  onEnd: (id: string) => void;
  endingId: string | null;
  showEnd?: boolean;
}) {
  const tone =
    discount.status === "active" ? "green" : discount.status === "scheduled" ? "blue" : "neutral";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/[0.05] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{discount.name}</p>
          <AdminBadge tone={tone}>{t.discounts.status[discount.status]}</AdminBadge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{discount.summary}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDateRange(discount.starts_at, discount.ends_at, intlLocale)}
          {discount.status === "active" && discount.daysLeft != null
            ? ` · ${interpolate(t.discounts.daysLeft, { count: String(discount.daysLeft) })}`
            : null}
          {discount.status === "scheduled" && discount.daysLeft != null
            ? ` · ${interpolate(t.discounts.startsIn, { count: String(discount.daysLeft) })}`
            : null}
        </p>
      </div>
      {showEnd && discount.status !== "ended" ? (
        <AdminButton
          variant="secondary"
          disabled={endingId === discount.id}
          onClick={() => onEnd(discount.id)}
        >
          {endingId === discount.id ? t.discounts.ending : t.discounts.endNow}
        </AdminButton>
      ) : null}
    </div>
  );
}
