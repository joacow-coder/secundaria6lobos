import { createFileRoute, Outlet } from "@tanstack/react-router";
import { FuturoLayout } from "@/components/futuro/Layout";

export const Route = createFileRoute("/tu-futuro")({
  component: () => (
    <FuturoLayout>
      <Outlet />
    </FuturoLayout>
  ),
});
