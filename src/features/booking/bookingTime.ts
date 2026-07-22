export const BOOKING_TIME_ZONE = "America/Curacao";

type CuracaoDateTime = {
  date: string;
  time: string;
};

export function curacaoDateTime(now = new Date()): CuracaoDateTime {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
}

export function isPickupInFutureInCuracao(
  pickupDate: string,
  pickupTime: string,
  now = new Date(),
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) || !/^\d{2}:\d{2}$/.test(pickupTime)) {
    return false;
  }

  const current = curacaoDateTime(now);
  return `${pickupDate}T${pickupTime}` > `${current.date}T${current.time}`;
}

export function assertPickupInFutureInCuracao(
  pickupDate: string,
  pickupTime: string,
  now = new Date(),
): void {
  if (!isPickupInFutureInCuracao(pickupDate, pickupTime, now)) {
    throw new Error("Pickup time must be in the future in Curacao.");
  }
}
