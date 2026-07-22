import type React from "react";

import { CheckCircle2, CreditCard, Shield, UserRound } from "lucide-react";

import { useBookingCopy } from "./useBookingCopy";
import type { BookingDraft, BookingStep } from "./bookingTypes";
import { maskLicenseNumber } from "./bookingValidation";
import { BookingOrderSummary } from "./components/BookingOrderSummary";

type BookingStepReviewProps = {
  draft: BookingDraft;
  dailyPrice: number;
  onEdit: (step: BookingStep) => void;
};

export function BookingStepReview({ draft, dailyPrice, onEdit }: BookingStepReviewProps) {
  const book = useBookingCopy();
  const copy = book.review;
  const maskedLicense = maskLicenseNumber(draft.driverLicense);

  return (
    <div>
      <div className="mb-6 rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-white to-white p-5">
        <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary/80">
          {copy.finalCheckEyebrow}
        </p>
        <h2 className="font-display text-2xl font-bold">{copy.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.subtitle}</p>
        <div className="mt-4 grid gap-2 text-sm font-semibold text-muted-foreground">
          <TrustPill icon={<CheckCircle2 className="size-3.5" />} label={book.cancellation} />
          <TrustPill
            icon={<Shield className="size-3.5" />}
            label={book.review.depositDueAtDelivery}
          />
          <TrustPill icon={<CreditCard className="size-3.5" />} label={book.review.payNowTotal} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewCard
            icon={<UserRound className="size-4" />}
            title={book.customer.title}
            onEdit={() => onEdit("customer")}
          >
            <p className="font-semibold text-foreground">{draft.guestName}</p>
            <p>{draft.guestEmail}</p>
            <p>{draft.guestPhone}</p>
          </ReviewCard>

          <ReviewCard
            icon={<Shield className="size-4" />}
            title={book.driver.title}
            onEdit={() => onEdit("customer")}
          >
            <p className="font-semibold text-foreground">{draft.guestName}</p>
            <p>
              {book.driver.license}: {maskedLicense}
            </p>
            <p>{draft.driverDateOfBirth}</p>
            {draft.arrivingByPlane && draft.flightNumber ? (
              <p>
                {book.driver.flightNumber}: {draft.flightNumber}
              </p>
            ) : null}
          </ReviewCard>
        </div>

        <ReviewCard
          icon={<CheckCircle2 className="size-4" />}
          title={book.insurance.title}
          onEdit={() => onEdit("extras")}
        >
          <p className="font-semibold text-foreground">
            {draft.insuranceOption === "daily"
              ? book.insurance.dailyTitle
              : book.insurance.depositTitle}
          </p>
          {draft.selectedExtras.length ? (
            <p>{draft.selectedExtras.map((extra) => extra.name).join(", ")}</p>
          ) : (
            <p>{book.extras.noneSelected}</p>
          )}
        </ReviewCard>

        <section className="rounded-[1.75rem] border border-border/80 bg-white p-5 shadow-[0_18px_44px_rgba(16,16,16,0.06)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary/80">
                {copy.preCheckoutEyebrow}
              </p>
              <h3 className="font-display text-xl font-bold text-[var(--logo-black)]">
                {book.summary}
              </h3>
            </div>
            <EditButton onClick={() => onEdit("cars")} />
          </div>
          <BookingOrderSummary draft={draft} dailyPrice={dailyPrice} variant="review" />
        </section>

        <p className="flex items-center gap-2 rounded-2xl border border-border bg-background-secondary/50 p-4 text-xs text-muted-foreground">
          <Shield className="size-3.5 text-success" /> {book.cancellation}
        </p>
      </div>
    </div>
  );
}

function TrustPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
      <span className="mt-0.5 shrink-0 text-success">{icon}</span>
      <span className="leading-relaxed">{label}</span>
    </span>
  );
}

function ReviewCard({
  icon,
  title,
  children,
  onEdit,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <section className="rounded-[1.5rem] border border-border/80 bg-white p-5 text-sm text-muted-foreground shadow-[0_12px_30px_rgba(16,16,16,0.04)] transition-all duration-200 hover:border-primary/30 hover:shadow-[0_16px_34px_rgba(16,16,16,0.06)] motion-reduce:transition-none">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
          <span>{title}</span>
        </p>
        {onEdit ? <EditButton onClick={onEdit} /> : null}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  const copy = useBookingCopy();
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      {copy.review.edit}
    </button>
  );
}
