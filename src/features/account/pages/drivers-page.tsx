import { Loader2, Pencil, Plus, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/provider";
import type { Driver } from "@/features/account/account-queries";

import {
  createDriver,
  deleteDriver,
  fetchDrivers,
  updateDriver,
} from "../account-queries";
import { useAuth } from "../auth-provider";

type DriverForm = {
  full_name: string;
  license_number: string;
  date_of_birth: string;
};

const emptyForm: DriverForm = {
  full_name: "",
  license_number: "",
  date_of_birth: "",
};

export function DriversPage() {
  const { messages } = useI18n();
  const { user } = useAuth();
  const copy = messages.account.drivers;

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<DriverForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadDrivers = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      setDrivers(await fetchDrivers(user.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDrivers();
  }, [user?.id]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleEdit = (driver: Driver) => {
    setEditingId(driver.id);
    setForm({
      full_name: driver.full_name,
      license_number: driver.license_number,
      date_of_birth: driver.date_of_birth ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await updateDriver(editingId, user.id, {
          full_name: form.full_name.trim(),
          license_number: form.license_number.trim(),
          date_of_birth: form.date_of_birth || null,
        });
      } else {
        await createDriver(user.id, {
          full_name: form.full_name.trim(),
          license_number: form.license_number.trim(),
          date_of_birth: form.date_of_birth || null,
        });
      }
      await loadDrivers();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (driverId: string) => {
    if (!user?.id || !window.confirm(copy.deleteConfirm)) return;
    setError("");
    try {
      await deleteDriver(driverId, user.id);
      await loadDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.saveError);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase text-[var(--logo-black)]">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-[4px] bg-[var(--logo-red)] px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-[#c92228]"
          >
            <Plus className="size-4" />
            {copy.add}
          </button>
        ) : null}
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {copy.notice}
      </div>

      {showForm ? (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="max-w-xl space-y-4 rounded-2xl border border-border bg-white p-6"
        >
          <h2 className="font-semibold text-[var(--logo-black)]">
            {editingId ? copy.editTitle : copy.addTitle}
          </h2>
          <DriverInput
            label={copy.fullName}
            value={form.full_name}
            onChange={(value) => setForm((current) => ({ ...current, full_name: value }))}
            required
          />
          <DriverInput
            label={copy.license}
            value={form.license_number}
            onChange={(value) => setForm((current) => ({ ...current, license_number: value }))}
            required
          />
          <DriverInput
            label={copy.dateOfBirth}
            type="date"
            value={form.date_of_birth}
            onChange={(value) => setForm((current) => ({ ...current, date_of_birth: value }))}
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-[4px] bg-[var(--logo-red)] px-5 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {copy.save}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="h-11 rounded-[4px] border border-border px-5 text-xs font-bold uppercase tracking-[0.1em]"
            >
              {copy.cancel}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      ) : drivers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {copy.empty}
        </p>
      ) : (
        <ul className="grid gap-3">
          {drivers.map((driver) => (
            <li
              key={driver.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span className="inline-grid size-10 place-items-center rounded-xl bg-[var(--logo-red)]/10 text-[var(--logo-red)]">
                  <User className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-[var(--logo-black)]">{driver.full_name}</p>
                  <p className="text-sm text-muted-foreground">{driver.license_number}</p>
                  {driver.date_of_birth ? (
                    <p className="text-xs text-muted-foreground">{driver.date_of_birth}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(driver)}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border hover:bg-black/[0.03]"
                  aria-label={copy.editTitle}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(driver.id)}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-destructive hover:bg-destructive/5"
                  aria-label={copy.delete}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DriverInput({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-xl border border-border bg-background-secondary px-4 text-sm outline-none focus:border-[var(--logo-red)]"
      />
    </label>
  );
}
