import { useQuery } from "@tanstack/react-query";

import { getCarAvailability } from "./api/availability.functions";

export function useBookingAvailability(pickupDate: string, returnDate: string) {
  const datesValid = Boolean(pickupDate && returnDate && pickupDate <= returnDate);

  return useQuery({
    queryKey: ["booking-availability", pickupDate, returnDate],
    enabled: datesValid,
    queryFn: () => getCarAvailability({ data: { pickupDate, returnDate } }),
    retry: (failureCount) => failureCount < 2,
    retryDelay: (attempt) => Math.min(750 * 2 ** attempt, 3_000),
    staleTime: 15_000,
  });
}
