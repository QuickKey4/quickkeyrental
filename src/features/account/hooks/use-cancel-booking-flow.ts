import { useCallback, useState } from "react";

import { cancelUserBooking, type BookingWithCar } from "../account-queries";

export function useCancelBookingFlow(
  onCancelled: () => void | Promise<void>,
  fallbackError: string,
) {
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
      } catch {
        setError(fallbackError);
      } finally {
        setLoading(false);
      }
    },
    [fallbackError, onCancelled, target],
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
