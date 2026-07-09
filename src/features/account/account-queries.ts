import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { sendBookingCancellationEmailsFn } from "./api/booking-management.functions";
import {
  canCancelBooking,
  requiresCancellationFee,
} from "./account-utils";

export type Profile = Tables<"profiles">;
export type Driver = Tables<"drivers">;
export type Document = Tables<"documents">;

export type BookingWithCar = Tables<"bookings"> & {
  cars: Pick<Tables<"cars">, "id" | "name" | "category" | "image_url" | "daily_price"> | null;
};

export async function fetchUserBookings(): Promise<BookingWithCar[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, cars ( id, name, category, image_url, daily_price )",
    )
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
  pickupDate?: string;
  returnDate?: string;
  deliveryAddress?: string;
  collectionAddress?: string;
  carId?: string;
};

export async function updateUserBookingRental(input: UpdateBookingRentalInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account is not configured yet.");

  const { error } = await supabase.rpc("update_booking_rental", {
    p_booking_id: input.bookingId,
    p_pickup_date: input.pickupDate ?? null,
    p_return_date: input.returnDate ?? null,
    p_delivery_address: input.deliveryAddress ?? null,
    p_collection_address: input.collectionAddress ?? null,
    p_car_id: input.carId ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
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

export async function updateProfile(userId: string, patch: TablesUpdate<"profiles">): Promise<Profile> {
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

  const { error } = await supabase.from("drivers").delete().eq("id", driverId).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function fetchDocuments(userId: string): Promise<Document[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function uploadDocument(
  userId: string,
  type: Tables<"documents">["document_type"],
  file: File,
): Promise<Document> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account is not configured yet.");

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
      verification_status: "pending",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDocument(documentId: string, userId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account is not configured yet.");

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!doc) return;

  await supabase.storage.from("customer-documents").remove([doc.file_path]);

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
