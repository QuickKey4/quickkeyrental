import { useCallback, useState } from "react";

import { cancelUserBooking, type BookingWithCar } from "../account-queries";

export function useCancelBookingFlow(onCancelled: () => void | Promise<void>) {
  const [target, setTarget] = useState<BookingWithCar | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestCancel = useCallback((booking: BookingWithCar) => {
    setError("");
    setTarget(booking);
  }, []);

  const close = useCallback(() => {
    if (loading) return;
    setTarget(null);
    setError("");
  }, [loading]);

  const confirmCancel = useCallback(
    async (acceptCancellationFee: boolean) => {
      if (!target) return;

      setLoading(true);
      setError("");
      try {
        await cancelUserBooking(target, { acceptCancellationFee });
        setTarget(null);
        await onCancelled();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not cancel booking.");
      } finally {
        setLoading(false);
      }
    },
    [onCancelled, target],
  );

  return {
    target,
    loading,
    error,
    requestCancel,
    confirmCancel,
    close,
    open: target !== null,
    setOpen: (open: boolean) => {
      if (!open) close();
    },
  };
}
