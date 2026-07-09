export function formatShortDate(date: Date, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateRange(intlLocale: string, start: string, end: string): string {
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  const formatter = new Intl.DateTimeFormat(intlLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}
