import { useMemo, useState } from "react";
import { ChevronDown, Phone } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type PhoneCountry = {
  iso: string;
  flag: string;
  name: string;
  dialCode: string;
  aliases?: string[];
};

const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "CW", flag: "🇨🇼", name: "Curaçao", dialCode: "5999" },
  { iso: "NL", flag: "🇳🇱", name: "Netherlands", dialCode: "31" },
  { iso: "AW", flag: "🇦🇼", name: "Aruba", dialCode: "297" },
  {
    iso: "BQ",
    flag: "🇧🇶",
    name: "Caribbean Netherlands",
    dialCode: "599",
    aliases: ["bonaire", "saba", "st eustatius", "statia"],
  },
  {
    iso: "SX",
    flag: "🇸🇽",
    name: "Sint Maarten",
    dialCode: "1721",
    aliases: ["saint martin", "st maarten"],
  },
  { iso: "SR", flag: "🇸🇷", name: "Suriname", dialCode: "597" },
  {
    iso: "DO",
    flag: "🇩🇴",
    name: "Dominican Republic",
    dialCode: "1",
    aliases: ["dominicana", "republica dominicana", "república dominicana", "domininican", "dr"],
  },
  { iso: "HT", flag: "🇭🇹", name: "Haiti", dialCode: "509" },
  { iso: "JM", flag: "🇯🇲", name: "Jamaica", dialCode: "1876" },
  { iso: "TT", flag: "🇹🇹", name: "Trinidad and Tobago", dialCode: "1868" },
  { iso: "BB", flag: "🇧🇧", name: "Barbados", dialCode: "1246" },
  { iso: "BS", flag: "🇧🇸", name: "Bahamas", dialCode: "1242" },
  { iso: "KY", flag: "🇰🇾", name: "Cayman Islands", dialCode: "1345" },
  { iso: "TC", flag: "🇹🇨", name: "Turks and Caicos Islands", dialCode: "1649" },
  { iso: "AG", flag: "🇦🇬", name: "Antigua and Barbuda", dialCode: "1268" },
  { iso: "AI", flag: "🇦🇮", name: "Anguilla", dialCode: "1264" },
  { iso: "DM", flag: "🇩🇲", name: "Dominica", dialCode: "1767" },
  { iso: "GD", flag: "🇬🇩", name: "Grenada", dialCode: "1473" },
  { iso: "KN", flag: "🇰🇳", name: "Saint Kitts and Nevis", dialCode: "1869", aliases: ["st kitts"] },
  { iso: "LC", flag: "🇱🇨", name: "Saint Lucia", dialCode: "1758", aliases: ["st lucia"] },
  {
    iso: "VC",
    flag: "🇻🇨",
    name: "Saint Vincent and the Grenadines",
    dialCode: "1784",
    aliases: ["st vincent"],
  },
  { iso: "VG", flag: "🇻🇬", name: "British Virgin Islands", dialCode: "1284", aliases: ["bvi"] },
  {
    iso: "VI",
    flag: "🇻🇮",
    name: "U.S. Virgin Islands",
    dialCode: "1340",
    aliases: ["us virgin islands"],
  },
  { iso: "PR", flag: "🇵🇷", name: "Puerto Rico", dialCode: "1" },
  { iso: "US", flag: "🇺🇸", name: "United States", dialCode: "1" },
  { iso: "CA", flag: "🇨🇦", name: "Canada", dialCode: "1" },
  { iso: "MX", flag: "🇲🇽", name: "Mexico", dialCode: "52" },
  { iso: "BZ", flag: "🇧🇿", name: "Belize", dialCode: "501" },
  { iso: "CR", flag: "🇨🇷", name: "Costa Rica", dialCode: "506" },
  { iso: "SV", flag: "🇸🇻", name: "El Salvador", dialCode: "503" },
  { iso: "GT", flag: "🇬🇹", name: "Guatemala", dialCode: "502" },
  { iso: "HN", flag: "🇭🇳", name: "Honduras", dialCode: "504" },
  { iso: "NI", flag: "🇳🇮", name: "Nicaragua", dialCode: "505" },
  { iso: "PA", flag: "🇵🇦", name: "Panama", dialCode: "507" },
  { iso: "AR", flag: "🇦🇷", name: "Argentina", dialCode: "54" },
  { iso: "BO", flag: "🇧🇴", name: "Bolivia", dialCode: "591" },
  { iso: "BR", flag: "🇧🇷", name: "Brazil", dialCode: "55" },
  { iso: "CL", flag: "🇨🇱", name: "Chile", dialCode: "56" },
  { iso: "CO", flag: "🇨🇴", name: "Colombia", dialCode: "57" },
  { iso: "EC", flag: "🇪🇨", name: "Ecuador", dialCode: "593" },
  { iso: "GY", flag: "🇬🇾", name: "Guyana", dialCode: "592" },
  { iso: "PY", flag: "🇵🇾", name: "Paraguay", dialCode: "595" },
  { iso: "PE", flag: "🇵🇪", name: "Peru", dialCode: "51" },
  { iso: "UY", flag: "🇺🇾", name: "Uruguay", dialCode: "598" },
  { iso: "VE", flag: "🇻🇪", name: "Venezuela", dialCode: "58" },
  { iso: "ES", flag: "🇪🇸", name: "Spain", dialCode: "34" },
  { iso: "PT", flag: "🇵🇹", name: "Portugal", dialCode: "351" },
  { iso: "BE", flag: "🇧🇪", name: "Belgium", dialCode: "32" },
  { iso: "DE", flag: "🇩🇪", name: "Germany", dialCode: "49" },
  { iso: "FR", flag: "🇫🇷", name: "France", dialCode: "33" },
  { iso: "GB", flag: "🇬🇧", name: "United Kingdom", dialCode: "44" },
  { iso: "IE", flag: "🇮🇪", name: "Ireland", dialCode: "353" },
  { iso: "IT", flag: "🇮🇹", name: "Italy", dialCode: "39" },
  { iso: "AT", flag: "🇦🇹", name: "Austria", dialCode: "43" },
  { iso: "CH", flag: "🇨🇭", name: "Switzerland", dialCode: "41" },
  { iso: "DK", flag: "🇩🇰", name: "Denmark", dialCode: "45" },
  { iso: "FI", flag: "🇫🇮", name: "Finland", dialCode: "358" },
  { iso: "NO", flag: "🇳🇴", name: "Norway", dialCode: "47" },
  { iso: "SE", flag: "🇸🇪", name: "Sweden", dialCode: "46" },
  { iso: "PL", flag: "🇵🇱", name: "Poland", dialCode: "48" },
  { iso: "GR", flag: "🇬🇷", name: "Greece", dialCode: "30" },
  { iso: "TR", flag: "🇹🇷", name: "Turkey", dialCode: "90" },
  { iso: "IL", flag: "🇮🇱", name: "Israel", dialCode: "972" },
  {
    iso: "AE",
    flag: "🇦🇪",
    name: "United Arab Emirates",
    dialCode: "971",
    aliases: ["uae", "dubai"],
  },
  { iso: "IN", flag: "🇮🇳", name: "India", dialCode: "91" },
  { iso: "CN", flag: "🇨🇳", name: "China", dialCode: "86" },
  { iso: "JP", flag: "🇯🇵", name: "Japan", dialCode: "81" },
  { iso: "KR", flag: "🇰🇷", name: "South Korea", dialCode: "82", aliases: ["korea"] },
  { iso: "ZA", flag: "🇿🇦", name: "South Africa", dialCode: "27" },
  { iso: "MA", flag: "🇲🇦", name: "Morocco", dialCode: "212" },
  { iso: "AU", flag: "🇦🇺", name: "Australia", dialCode: "61" },
  { iso: "NZ", flag: "🇳🇿", name: "New Zealand", dialCode: "64" },
];

const LOCALE_COUNTRY: Record<string, string> = {
  en: "US",
  nl: "NL",
  es: "ES",
  pap: "CW",
  pt: "PT",
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function browserCountry(): string | null {
  if (typeof navigator === "undefined") return null;
  for (const language of navigator.languages ?? [navigator.language]) {
    const region = language.split("-")[1]?.toUpperCase();
    if (region && PHONE_COUNTRIES.some((country) => country.iso === region)) return region;
  }
  return null;
}

function countryForValue(value: string, fallbackIso: string) {
  const digits = digitsOnly(value);
  const matches = PHONE_COUNTRIES.filter((country) => digits.startsWith(country.dialCode)).sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  );
  return (
    matches[0] ??
    PHONE_COUNTRIES.find((country) => country.iso === fallbackIso) ??
    PHONE_COUNTRIES[0]
  );
}

function localNumberForValue(value: string, country: PhoneCountry) {
  const digits = digitsOnly(value);
  return digits.startsWith(country.dialCode) ? digits.slice(country.dialCode.length) : digits;
}

export function InternationalPhoneInput({
  value,
  onChange,
  locale,
  label,
  hint,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  locale: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  const fallbackIso = browserCountry() ?? LOCALE_COUNTRY[locale] ?? "CW";
  const selectedCountry = useMemo(() => countryForValue(value, fallbackIso), [fallbackIso, value]);
  const [country, setCountry] = useState(selectedCountry);
  const [query, setQuery] = useState("");
  const localNumber = localNumberForValue(value, country);
  const filteredCountries = PHONE_COUNTRIES.filter((option) => {
    const normalizedQuery = query.trim().toLowerCase();
    const haystack = `${option.name} ${option.iso} ${option.dialCode} ${
      option.aliases?.join(" ") ?? ""
    }`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const updateNumber = (nextCountry: PhoneCountry, nextLocalNumber: string) => {
    const digits = digitsOnly(nextLocalNumber);
    onChange(digits ? `+${nextCountry.dialCode}${digits}` : "");
  };

  return (
    <label className="flex flex-col gap-1.5 sm:col-span-1" data-booking-field="guestPhone">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}{" "}
        <span className="text-destructive" aria-label="required">
          *
        </span>
      </span>
      <span
        className={cn(
          "flex min-h-12 items-center gap-2 rounded-xl border bg-background-secondary px-3 transition-all duration-200 focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_8px_20px_rgba(16,16,16,0.05)]",
          error ? "border-destructive/60" : "border-border",
        )}
      >
        <Phone className="size-4 shrink-0 text-primary" />
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-border bg-white px-2 text-sm font-semibold"
              aria-label="Change phone country"
            >
              <span aria-hidden="true">{country.flag}</span>
              <span>+{country.dialCode}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country or code"
              className="mb-2 h-10 w-full rounded-lg border border-border px-3 text-base outline-none focus:border-primary sm:text-sm"
            />
            <div className="max-h-64 overflow-y-auto">
              {filteredCountries.length ? (
                filteredCountries.map((option) => (
                  <button
                    key={`${option.iso}-${option.dialCode}`}
                    type="button"
                    onClick={() => {
                      setCountry(option);
                      setQuery("");
                      updateNumber(option, localNumber);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-primary/5",
                      option.iso === country.iso && "bg-primary/10 text-primary",
                    )}
                  >
                    <span aria-hidden="true">{option.flag}</span>
                    <span className="flex-1">{option.name}</span>
                    <span className="font-semibold">+{option.dialCode}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  No country found. Try the country name or calling code.
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <input
          value={localNumber}
          onChange={(event) => updateNumber(country, event.target.value)}
          placeholder="612345678"
          autoComplete="tel-national"
          inputMode="tel"
          aria-invalid={Boolean(error)}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        />
      </span>
      {hint && !error ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      {error ? (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
