import { useState } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { useCityMind } from "@/lib/citymind";

export function Login() {
  const { login } = useCityMind();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = login(email, password);
    if (u) toast.success(`Welcome, ${u.name}`);
    else toast.error("Invalid credentials");
  };

  const fill = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#f8fafc" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3"
            style={{ background: "#1a365d" }}
          >
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a365d" }}>
            CityMind
          </h1>
          <p className="text-sm text-slate-600">
            AI-Powered Smart City Management · Pakistan
          </p>
          <span
            className="inline-block mt-2 text-xs font-semibold text-white px-2 py-0.5 rounded-full"
            style={{ background: "#059669" }}
          >
            SDG 11 · Vision 2030
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="you@citymind.pk"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg font-semibold text-white transition hover:opacity-90"
              style={{ background: "#1a365d" }}
            >
              Sign in
            </button>
          </form>

          <div className="mt-5 border-t pt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">DEMO CREDENTIALS — click to autofill</p>
            <div className="space-y-1.5 text-xs">
              {[
                { label: "User", e: "user@citymind.pk", p: "user123" },
                { label: "Admin", e: "admin@citymind.pk", p: "admin123" },
                { label: "Client", e: "client@citymind.pk", p: "client123" },
              ].map((c) => (
                <button
                  key={c.e}
                  type="button"
                  onClick={() => fill(c.e, c.p)}
                  className="w-full flex justify-between items-center px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left"
                >
                  <span className="font-semibold text-slate-700">{c.label}</span>
                  <span className="font-mono text-slate-600">
                    {c.e} / {c.p}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
