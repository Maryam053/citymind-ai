import { useState, type ReactNode } from "react";
import { Building2, LogOut, Menu, X, LayoutDashboard, Globe } from "lucide-react";
import { useCityMind } from "@/lib/citymind";

export function Layout({
  title,
  children,
  navLabel,
}: {
  title: string;
  children: ReactNode;
  navLabel: string;
}) {
  const { user, logout } = useCityMind();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>
      {/* Sidebar */}
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-40 inset-y-0 left-0 w-64 transition-transform`}
        style={{ background: "#1a365d", color: "#fff" }}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-lg leading-tight">CityMind</div>
                <div className="text-xs text-white/60">Smart Cities · PK</div>
              </div>
            </div>
            <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-sm font-medium">
              <LayoutDashboard className="w-4 h-4" />
              {navLabel}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70">
              <Globe className="w-4 h-4" />
              SDG 11 · Vision 2030
            </div>
          </nav>

          <div className="p-3 border-t border-white/10 space-y-2">
            <div className="px-3 py-2 text-xs">
              <div className="text-white/50">Signed in as</div>
              <div className="font-medium truncate">{user?.email}</div>
              <div className="text-emerald-300 capitalize text-xs">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 -ml-2"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg md:text-xl font-semibold" style={{ color: "#1a365d" }}>
                {title}
              </h1>
            </div>
            <span
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
              style={{ background: "#059669" }}
              title="UN Sustainable Development Goal 11"
            >
              SDG 11
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">{children}</main>

        <footer className="text-center text-xs text-slate-500 py-4 border-t bg-white">
          CityMind © 2025 | Aligned with Vision 2030 &amp; SDG 11
        </footer>
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-base font-semibold mb-3" style={{ color: "#1a365d" }}>
      {children}
    </h2>
  );
}

export function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}

export const severityColor = (s: string) => {
  switch (s) {
    case "Critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "High":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export const statusColor = (s: string) => {
  switch (s) {
    case "Resolved":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-red-100 text-red-700 border-red-200";
  }
};
