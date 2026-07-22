import { Loader2, Mail, MessageCircle, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/provider";

import { AccountContent } from "../account-layout";
import { fetchUserBookings, updateProfile } from "../account-queries";
import { requestEmailChange } from "../auth";
import { useAuth } from "../auth-provider";
import {
  AccountCard,
  AccountPageHeader,
  AccountPrimaryButton,
  AccountSectionTitle,
} from "../components/account-ui";

export function ProfilePage() {
  const { messages } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  const copy = messages.account.profile;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [marketingEmail, setMarketingEmail] = useState(false);
  const [marketingWhatsapp, setMarketingWhatsapp] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setMarketingEmail(profile.marketing_email ?? false);
    setMarketingWhatsapp(profile.marketing_whatsapp ?? false);
  }, [profile]);

  useEffect(() => {
    if (!user?.id) return;
    if (profile?.full_name?.trim() && profile?.phone?.trim()) return;

    void fetchUserBookings().then((bookings) => {
      const latest = bookings[0];
      if (!latest) return;
      setFullName((current) => current || latest.guest_name?.trim() || "");
      setPhone((current) => current || latest.guest_phone?.trim() || "");
    });
  }, [user?.id, profile?.full_name, profile?.phone]);

  const handleEmailChange = async () => {
    if (!newEmail.trim() || newEmail.trim() === user?.email) return;

    setChangingEmail(true);
    setEmailError("");
    setEmailSent(false);

    const result = await requestEmailChange(newEmail);
    setChangingEmail(false);

    if (!result.ok) {
      setEmailError(copy.emailChangeError);
      return;
    }

    setEmailSent(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await updateProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        marketing_email: marketingEmail,
        marketing_whatsapp: marketingWhatsapp,
      });
      await refreshProfile();
      setSaved(true);
    } catch {
      setError(copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    fullName.trim() ||
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    copy.guestName;

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <AccountContent className="space-y-6">
      <AccountPageHeader title={copy.title} subtitle={copy.subtitle} />

      <AccountCard>
        <div className="flex items-center gap-4">
          <span className="inline-grid size-14 place-items-center rounded-2xl bg-[var(--logo-red)]/10 font-display text-lg font-bold text-[var(--logo-red)]">
            {initials}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-[var(--logo-black)]">
              {displayName}
            </h2>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            {phone ? <p className="truncate text-sm text-muted-foreground">{phone}</p> : null}
          </div>
        </div>
      </AccountCard>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
        <AccountCard>
          <AccountSectionTitle title={copy.profileCard} />
          <div className="space-y-4">
            <ProfileField
              icon={<User className="size-4" />}
              label={copy.fullName}
              value={fullName}
              onChange={setFullName}
              autoComplete="name"
            />
            <ProfileField
              icon={<Phone className="size-4" />}
              label={copy.phone}
              value={phone}
              onChange={setPhone}
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
        </AccountCard>

        <AccountCard>
          <AccountSectionTitle title={copy.email} />
          <ProfileField
            icon={<Mail className="size-4" />}
            label={copy.email}
            value={user?.email ?? profile?.email ?? ""}
            onChange={() => undefined}
            type="email"
            disabled
          />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{copy.emailHint}</p>

          <div className="mt-5 border-t border-black/[0.05] pt-5">
            <div className="space-y-3">
              <ProfileField
                icon={<Mail className="size-4" />}
                label={copy.newEmail}
                value={newEmail}
                onChange={setNewEmail}
                type="email"
                autoComplete="email"
              />
              {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
              {emailSent ? <p className="text-sm text-emerald-700">{copy.emailSent}</p> : null}
              <AccountPrimaryButton
                type="button"
                disabled={changingEmail || !newEmail.trim()}
                className="h-11 px-5"
                onClick={() => void handleEmailChange()}
              >
                {changingEmail ? <Loader2 className="size-4 animate-spin" /> : null}
                {copy.changeEmail}
              </AccountPrimaryButton>
            </div>
          </div>
        </AccountCard>

        <AccountCard>
          <AccountSectionTitle title={copy.communicationPrefs} />
          <div className="space-y-3">
            <PreferenceToggle
              icon={<Mail className="size-4" />}
              label={copy.marketingEmail}
              checked={marketingEmail}
              onChange={setMarketingEmail}
            />
            <PreferenceToggle
              icon={<MessageCircle className="size-4" />}
              label={copy.marketingWhatsapp}
              checked={marketingWhatsapp}
              onChange={setMarketingWhatsapp}
            />
          </div>
        </AccountCard>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {saved ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {copy.saved}
          </p>
        ) : null}

        <AccountPrimaryButton type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {copy.save}
        </AccountPrimaryButton>
      </form>
    </AccountContent>
  );
}

function ProfileField({
  icon,
  label,
  value,
  onChange,
  disabled,
  ...props
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span
        className={`flex h-12 min-w-0 items-center gap-3 rounded-xl border border-black/[0.08] bg-[#f8f8f6] px-4 transition-colors focus-within:border-[var(--logo-red)] focus-within:bg-white ${disabled ? "opacity-60" : ""}`}
      >
        <span className="text-[var(--logo-red)]">{icon}</span>
        <input
          {...props}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base outline-none disabled:cursor-not-allowed"
        />
      </span>
    </label>
  );
}

function PreferenceToggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/[0.05] bg-[#f8f8f6] p-3.5 transition-colors hover:bg-[#f4f4f2]">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--logo-red)]/8 text-[var(--logo-red)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-base leading-relaxed text-[var(--logo-black)] sm:text-sm">
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 shrink-0 rounded border-black/20 accent-[var(--logo-red)]"
      />
    </label>
  );
}
