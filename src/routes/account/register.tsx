import { createFileRoute, redirect } from "@tanstack/react-router";

type Search = {
  redirect?: string;
};

export const Route = createFileRoute("/account/register")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/account/login", search });
  },
});
