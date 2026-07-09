import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/account/forgot-password")({
  beforeLoad: () => {
    throw redirect({ to: "/account/login" });
  },
});
