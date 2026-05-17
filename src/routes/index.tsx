import { createFileRoute } from "@tanstack/react-router";
import { CityMindProvider, useCityMind } from "@/lib/citymind";
import { Login } from "@/components/citymind/Login";
import { UserDashboard } from "@/components/citymind/UserDashboard";
import { AdminDashboard } from "@/components/citymind/AdminDashboard";
import { ClientDashboard } from "@/components/citymind/ClientDashboard";
import { Toaster } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Router() {
  const { user } = useCityMind();
  if (!user) return <Login />;
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "client") return <ClientDashboard />;
  return <UserDashboard />;
}

function Index() {
  return (
    <CityMindProvider>
      <Router />
      <Toaster position="top-right" richColors />
    </CityMindProvider>
  );
}
