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
    <div className="account-login-shell flex min-h-svh w-full max-w-[100vw] flex-col items-center justify-center overflow-x-hidden bg-white px-4 py-8 sm:px-5 sm:py-12">
      <div className="mb-8">
        <Link to="/">
          <Logo size="md" />
        </Link>
      </div>

      <div className="account-login-card w-full min-w-0 rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-md)] sm:max-w-md sm:rounded-3xl sm:p-8">
        <h1 className="font-display text-2xl font-bold uppercase text-[var(--logo-black)]">
          {copy.title}
        </h1>
        <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
          {copy.subtitle}
        </p>

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
