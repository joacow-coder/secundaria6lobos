import { Outlet, createFileRoute } from "@tanstack/react-router";
import { BibliotecaSessionProvider } from "@/lib/biblioteca/session";

export const Route = createFileRoute("/biblioteca")({
  component: BibliotecaLayout,
});

function BibliotecaLayout() {
  return (
    <BibliotecaSessionProvider>
      <Outlet />
    </BibliotecaSessionProvider>
  );
}