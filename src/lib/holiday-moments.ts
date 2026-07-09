export const holidayMomentKeys = ["beach", "town", "coast", "handover"] as const;

export type HolidayMomentKey = (typeof holidayMomentKeys)[number];
