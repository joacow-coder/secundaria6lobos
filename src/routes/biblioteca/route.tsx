import { Outlet, createFileRoute } from "@tanstack/react-router";
import { BibliotecaSessionProvider } from "@/lib/biblioteca/session";
import { BibliotecaRealtime } from "@/components/biblioteca/BibliotecaRealtime";

export const Route = createFileRoute("/biblioteca")({
  component: BibliotecaLayout,
});

function BibliotecaLayout() {
  return (
    <BibliotecaSessionProvider>
      <BibliotecaRealtime />
      <Outlet />
    </BibliotecaSessionProvider>
  );
}
