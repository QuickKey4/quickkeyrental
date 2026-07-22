import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import {
  sendBookingCancellationEmailsFn,
  sendDocumentUploadedNotificationFn,
} from "./api/booking-management.functions";
import { canCancelBooking, requiresCancellationFee } from "./account-utils";

export type Profile = Tables<"profiles">;
export type Driver = Tables<"drivers">;
export type Document = Tables<"documents">;
export type RewardTransaction = {
  id: string;
  points_delta: number;
  transaction_type: string;
  reason: string;
  created_at: string;
  status: string;
};
export type RewardTier = {
  points: number;
  credit: number;
};

export type BookingWithCar = Tables<"bookings"> & {
  cars: Pick<Tables<"cars">, "id" | "name" | "category" | "image_url" | "daily_price"> | null;
};

export async function fetchUserBookings(): Promise<BookingWithCar[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select("*, cars ( id, name, category, image_url, daily_price )")
    .order("pickup_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as BookingWithCar[];
}

export async function fetchUserBooking(bookingId: string): Promise<BookingWithCar | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("bookings")
    .select("*, cars ( id, name, category, image_url, daily_price )")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as BookingWithCar | null;
}

export async function cancelUserBooking(
  booking: BookingWithCar,
  options: { acceptCancellationFee?: boolean } = {},
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account is not configured yet.");

  if (!canCancelBooking(booking)) {
    throw new Error("This booking can no longer be cancelled online. Please contact support.");
  }

  const feeRequired = requiresCancellationFee(booking);
  if (feeRequired && !options.acceptCancellationFee) {
    throw new Error("You must accept the cancellation fee to cancel this booking.");
  }

  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: booking.id,
    p_accept_cancellation_fee: options.acceptCancellationFee ?? false,
  });
  if (error) throw new Error(error.message);

  try {
    await sendBookingCancellationEmailsFn({ data: { bookingId: booking.id } });
  } catch {
    // Cancellation succeeded even if email provider is not configured.
  }
}

export type UpdateBookingRentalInput = {
  bookingId: string;
  deliveryAddress?: string;
  collectionAddress?: string;
  addExtras?: { id: string; quantity: number }[];
  additionalDriverName?: string;
  additionalDriverLicense?: string;
};

export async function updateUserBookingRental(input: UpdateBookingRentalInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account is not configured yet.");

  const { error } = await supabase.rpc("update_booking_service_items", {
    p_booking_id: input.bookingId,
    p_delivery_address: input.deliveryAddress ?? null,
    p_collection_address: input.collectionAddress ?? null,
    p_add_extras: input.addExtras ?? [],
    p_additional_driver_name: input.additionalDriverName ?? null,
    p_additional_driver_license: input.additionalDriverLicense ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Fill empty profile name/phone from the user's most recent linked booking. */
export async function hydrateProfileFromBookings(userId: string): Promise<Profile | null> {
  const profile = await fetchProfile(userId);
  if (!profile) return null;

  const needsName = !profile.full_name?.trim();
  const needsPhone = !profile.phone?.trim();
  if (!needsName && !needsPhone) return profile;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return profile;

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("guest_name, guest_phone")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !booking) return profile;

  const patch: TablesUpdate<"profiles"> = {};
  if (needsName && booking.guest_name?.trim()) patch.full_name = booking.guest_name.trim();
  if (needsPhone && booking.guest_phone?.trim()) patch.phone = booking.guest_phone.trim();

  if (Object.keys(patch).length === 0) return profile;
  return updateProfile(userId, patch);
}

export async function updateProfile(
  userId: string,
  patch: TablesUpdate<"profiles">,
): Promise<Profile> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account is not configured yet.");

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchDrivers(userId: string): Promise<Driver[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createDriver(
  userId: string,
  input: Omit<TablesInsert<"drivers">, "id" | "user_id" | "created_at">,
): Promise<Driver> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account is not configured yet.");

  const { data, error } = await supabase
    .from("drivers")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateDriver(
  driverId: string,
  userId: string,
  patch: TablesUpdate<"drivers">,
): Promise<Driver> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account is not configured yet.");

  const { data, error } = await supabase
    .from("drivers")
    .update(patch)
    .eq("id", driverId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDriver(driverId: string, userId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account is not configured yet.");

  const { error } = await supabase
    .from("drivers")
    .delete()
    .eq("id", driverId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function fetchDocuments(userId: string): Promise<Document[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const [{ data, error }, { data: deletedDocuments, error: deletedError }] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.rpc("get_my_deleted_document_tombstones"),
  ]);

  if (error) throw new Error(error.message);
  if (deletedError) throw new Error(deletedError.message);

  const tombstones: Document[] = (deletedDocuments ?? []).map((doc) => ({
    id: doc.document_id,
    user_id: userId,
    document_type: doc.document_type,
    verification_status: doc.verification_status,
    deleted_at: doc.deleted_at,
    deletion_due_at: null,
    deletion_reason: null,
    file_url: "",
    file_name: doc.file_name,
    file_path: null,
    file_size: null,
    mime_type: null,
    uploaded_at: doc.uploaded_at,
    created_at: doc.uploaded_at,
    verified_at: null,
    verified_by: null,
  }));

  return [...(data ?? []), ...tombstones].sort((a, b) => {
    const aTime = new Date(a.deleted_at ?? a.created_at).getTime();
    const bTime = new Date(b.deleted_at ?? b.created_at).getTime();
    return bTime - aTime;
  });
}

export async function uploadDocument(
  userId: string,
  type: Tables<"documents">["document_type"],
  file: File,
): Promise<Document> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account is not configured yet.");

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
  const maxSize = 8 * 1024 * 1024;

  if (!allowedTypes.has(file.type)) {
    throw new Error("Unsupported document file type.");
  }
  if (file.size > maxSize) {
    throw new Error("Document file is too large.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${type}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("customer-documents")
    .upload(path, file, { upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      document_type: type,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      verification_status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from("customer-documents").remove([path]);
    throw new Error(error.message);
  }

  try {
    await sendDocumentUploadedNotificationFn({ data: { documentId: data.id } });
  } catch {
    // Document upload succeeded even if email provider is not configured.
  }

  return data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account is not configured yet.");

  const { error } = await supabase.rpc("delete_own_pending_document", {
    p_document_id: documentId,
  });

  if (error) throw new Error(error.message);
}

export async function fetchRewards(userId: string): Promise<{
  balance: number;
  transactions: RewardTransaction[];
  tiers: RewardTier[];
}> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { balance: 0, transactions: [], tiers: defaultRewardTiers() };

  const [{ data, error }, { data: config }] = await Promise.all([
    supabase
      .from("reward_transactions")
      .select("id, points_delta, transaction_type, reason, created_at, status")
      .eq("customer_id", userId)
      .eq("status", "posted")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("reward_config").select("value").eq("key", "redemption_tiers").maybeSingle(),
  ]);

  if (error) throw new Error(error.message);
  const transactions = (data ?? []) as RewardTransaction[];
  return {
    balance: transactions.reduce((sum, row) => sum + Number(row.points_delta), 0),
    transactions,
    tiers: parseRewardTiers(config?.value),
  };
}

function defaultRewardTiers(): RewardTier[] {
  return [
    { points: 500, credit: 10 },
    { points: 1000, credit: 20 },
    { points: 2500, credit: 50 },
    { points: 5000, credit: 100 },
  ];
}

function parseRewardTiers(value: unknown): RewardTier[] {
  if (!Array.isArray(value)) return defaultRewardTiers();
  const tiers = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as { points?: unknown; credit?: unknown };
    const points = Number(candidate.points);
    const credit = Number(candidate.credit);
    return Number.isFinite(points) && Number.isFinite(credit) && points > 0 && credit > 0
      ? [{ points, credit }]
      : [];
  });
  return tiers.length > 0 ? tiers : defaultRewardTiers();
}
