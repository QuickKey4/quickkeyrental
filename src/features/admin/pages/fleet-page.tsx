import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { FleetPhoto } from "@/components/fleet-photo";
import { useFleet } from "@/hooks/use-fleet";
import { fleetKeyFromCar } from "@/features/booking/bookingUtils";

import { getAdminFleet, updateAdminFleetVehicle } from "../api/admin.functions";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminField,
  AdminPageHeader,
  adminInputClassName,
  fleetBadgeTone,
} from "../components/admin-ui";
import { useAdminI18n, fleetStatusLabel } from "../hooks/use-admin-i18n";
import { useAdminSecret } from "../hooks/use-admin-user";
import { bookingRef, getOperationalStatus, type FleetStatus } from "../lib/admin-utils";
import type { AdminBooking } from "../lib/admin-utils";

type FleetCar = Awaited<ReturnType<typeof getAdminFleet>>[number];

export function AdminFleetPage() {
  const adminSecret = useAdminSecret();
  const { t } = useAdminI18n();
  const { fleet } = useFleet();
  const [cars, setCars] = useState<FleetCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [plateDraft, setPlateDraft] = useState("");
  const [mileageDraft, setMileageDraft] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    if (!adminSecret) return;
    void getAdminFleet({ data: { adminSecret } })
      .then(setCars)
      .finally(() => setLoading(false));
  };

  useEffect(load, [adminSecret]);

  const updateStatus = async (carId: string, fleetStatus: FleetStatus) => {
    if (!adminSecret) return;
    const car = cars.find((item) => item.id === carId);
    const message =
      fleetStatus === "maintenance"
        ? t.fleet.confirmMaintenance
        : fleetStatus === "disabled"
          ? t.fleet.confirmDisable
          : t.fleet.confirmAvailable;

    if (!window.confirm(message.replace("{vehicle}", car?.name ?? t.vehicle))) return;

    setError("");
    try {
      await updateAdminFleetVehicle({ data: { adminSecret, carId, fleetStatus } });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.fleet.statusUpdateError);
    }
  };

  const startEdit = (car: FleetCar) => {
    setEditingId(car.id);
    setPlateDraft(car.license_plate ?? "");
    setMileageDraft(car.mileage != null ? String(car.mileage) : "");
  };

  const saveEdit = async (carId: string) => {
    if (!adminSecret) return;
    const mileage = mileageDraft.trim() ? Number.parseInt(mileageDraft, 10) : undefined;
    await updateAdminFleetVehicle({
      data: {
        adminSecret,
        carId,
        licensePlate: plateDraft.trim(),
        mileage: Number.isFinite(mileage) ? mileage : undefined,
      },
    });
    setEditingId(null);
    load();
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t.fleet.loading}</p>;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t.fleet.title} subtitle={t.fleet.subtitle} />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {cars.map((car) => {
          const fleetKey = fleetKeyFromCar(car);
          const vehicle = fleet.find((v) => v.key === fleetKey);
          const status = resolveFleetStatus(car);
          const activeBooking = car.activeBooking as AdminBooking | null;
          const isEditing = editingId === car.id;

          return (
            <AdminCard key={car.id} padding="none" className="overflow-hidden">
              {vehicle ? (
                <FleetPhoto
                  src={vehicle.image}
                  alt={car.name}
                  className="h-40 w-full bg-[#f4f4f2]"
                  imgClassName="p-4"
                  fit="contain"
                  tint={false}
                />
              ) : (
                <div className="h-40 bg-[#f4f4f2]" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-bold">{car.name}</h3>
                  <AdminBadge tone={fleetBadgeTone(status)}>
                    {fleetStatusLabel(status, t.fleetStatus)}
                  </AdminBadge>
                </div>

                {activeBooking ? (
                  <div className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                      {t.fleet.currentlyRented}
                    </p>
                    <p className="mt-1 font-medium text-blue-950">{activeBooking.guest_name}</p>
                    <Link
                      to="/admin/bookings/$bookingId"
                      params={{ bookingId: activeBooking.id }}
                      className="mt-1 inline-block text-xs font-semibold text-[var(--logo-red)]"
                    >
                      {t.ref}: {bookingRef(activeBooking.id)}
                    </Link>
                  </div>
                ) : null}

                {isEditing ? (
                  <div className="mt-3 space-y-3">
                    <AdminField label={t.fleet.licensePlate}>
                      <input
                        type="text"
                        value={plateDraft}
                        onChange={(e) => setPlateDraft(e.target.value)}
                        className={adminInputClassName}
                      />
                    </AdminField>
                    <AdminField label={t.fleet.mileageKm}>
                      <input
                        type="number"
                        min={0}
                        value={mileageDraft}
                        onChange={(e) => setMileageDraft(e.target.value)}
                        className={adminInputClassName}
                      />
                    </AdminField>
                    <div className="flex gap-2">
                      <AdminButton variant="primary" onClick={() => void saveEdit(car.id)}>
                        {t.save}
                      </AdminButton>
                      <AdminButton variant="ghost" onClick={() => setEditingId(null)}>
                        {t.cancel}
                      </AdminButton>
                    </div>
                  </div>
                ) : (
                  <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{t.fleet.plate}</span>
                      <span className="font-medium text-foreground">
                        {car.license_plate ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.fleet.year}</span>
                      <span className="font-medium text-foreground">{car.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.fleet.mileage}</span>
                      <span className="font-medium text-foreground">
                        {car.mileage != null ? `${car.mileage.toLocaleString()} km` : "—"}
                      </span>
                    </div>
                  </dl>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {!isEditing ? (
                    <AdminButton variant="ghost" onClick={() => startEdit(car)}>
                      {t.fleet.editPlateMileage}
                    </AdminButton>
                  ) : null}
                  <AdminButton
                    variant="secondary"
                    onClick={() => void updateStatus(car.id, "maintenance")}
                  >
                    {t.fleet.maintenance}
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    onClick={() => void updateStatus(car.id, "disabled")}
                  >
                    {t.fleet.disable}
                  </AdminButton>
                  <AdminButton
                    variant="primary"
                    onClick={() => void updateStatus(car.id, "available")}
                  >
                    {t.fleet.markAvailable}
                  </AdminButton>
                </div>
              </div>
            </AdminCard>
          );
        })}
      </div>
    </div>
  );
}

function resolveFleetStatus(car: FleetCar): FleetStatus {
  if (car.fleet_status === "disabled" || car.fleet_status === "maintenance") {
    return car.fleet_status as FleetStatus;
  }
  if (car.activeBooking && getOperationalStatus(car.activeBooking) === "active") {
    return "on_rental";
  }
  if (car.fleet_status === "on_rental" && !car.activeBooking) {
    return "available";
  }
  return (car.fleet_status as FleetStatus) || "available";
}
