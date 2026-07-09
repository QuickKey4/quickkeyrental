import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/logo";
import { useI18n } from "@/i18n/provider";

import { LoginEmailFlow } from "../components/login-email-flow";

type LoginSearch = {
  redirect?: string;
};

type LoginPageProps = {
  search?: LoginSearch;
};

export function LoginPage({ search }: LoginPageProps) {
  const { messages } = useI18n();
  const copy = messages.account.auth.login;
  const redirectTo = search?.redirect ?? "/account";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 py-12">
      <div className="mb-8">
        <Link to="/">
          <Logo size="md" />
        </Link>
      </div>

      <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-[var(--shadow-md)]">
        <h1 className="font-display text-2xl font-bold uppercase text-[var(--logo-black)]">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.subtitle}</p>

        <div className="mt-8">
          <LoginEmailFlow redirectPath={redirectTo} />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/book" className="font-semibold text-[var(--logo-red)] hover:underline">
            {copy.bookInstead}
          </Link>
        </p>
      </div>
    </div>
  );
}
