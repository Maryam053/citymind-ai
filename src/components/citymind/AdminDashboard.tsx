import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { Sparkles, CheckCircle, XCircle } from "lucide-react";
import {
  callOpenRouter,
  useCityMind,
  type Category,
  type City,
  type Severity,
  type Status,
} from "@/lib/citymind";
import { Card, Layout, SectionTitle, Spinner, severityColor, statusColor } from "./Layout";

const CITIES: City[] = ["Lahore", "Karachi", "Islamabad"];
const CATS: Category[] = ["Traffic", "Waste", "Housing", "Energy", "Green Space"];
const SEVS: Severity[] = ["Low", "Medium", "High", "Critical"];
const STATUSES: Status[] = ["Open", "In Progress", "Resolved"];

const POPS: Record<City, string> = {
  Lahore: "13.5M · 6,300/km²",
  Karachi: "16.1M · 24,000/km²",
  Islamabad: "1.1M · 1,950/km²",
};

export function AdminDashboard() {
  const { issues, updateIssue, apiKey, setApiKey } = useCityMind();

  const byCategory = useMemo(
    () =>
      CATS.map((c) => ({
        name: c,
        count: issues.filter((i) => i.category === c).length,
      })),
    [issues],
  );

  const byStatus = useMemo(
    () =>
      STATUSES.map((s) => ({
        name: s,
        value: issues.filter((i) => i.status === s).length,
      })),
    [issues],
  );

  const statusColors = ["#ef4444", "#eab308", "#10b981"];

  // filters
  const [fCity, setFCity] = useState<string>("all");
  const [fCat, setFCat] = useState<string>("all");
  const [fSev, setFSev] = useState<string>("all");
  const [fStat, setFStat] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = issues.filter(
    (i) =>
      (fCity === "all" || i.city === fCity) &&
      (fCat === "all" || i.category === fCat) &&
      (fSev === "all" || i.severity === fSev) &&
      (fStat === "all" || i.status === fStat),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  // AI policy
  const [polCat, setPolCat] = useState<Category>("Traffic");
  const [polLoading, setPolLoading] = useState(false);
  const [polResp, setPolResp] = useState<string>("");

  const generatePolicy = async () => {
    setPolLoading(true);
    setPolResp("");
    try {
      const reply = await callOpenRouter(apiKey, [
        {
          role: "user",
          content: `As an urban planning expert for Pakistan, generate a detailed policy recommendation for addressing ${polCat} issues in Pakistani cities. Include 3 specific action items, estimated timeline, and alignment with Vision 2030. Format with clear headings.`,
        },
      ]);
      setPolResp(reply);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPolLoading(false);
    }
  };

  // API key form
  const [keyInput, setKeyInput] = useState(apiKey);
  const saveKey = () => {
    setApiKey(keyInput.trim());
    toast.success("API key saved");
  };

  return (
    <Layout title="CityMind Admin Control Center" navLabel="Admin Console">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total Issues", val: 127, color: "#1a365d" },
          { label: "Critical Issues", val: 23, color: "#dc2626" },
          { label: "Resolution Rate", val: "67%", color: "#059669" },
          { label: "AI Queries Today", val: 341, color: "#1a365d" },
        ].map((k) => (
          <Card key={k.label} className="p-5">
            <div className="text-xs text-slate-500 font-medium uppercase">{k.label}</div>
            <div className="text-3xl font-bold mt-1" style={{ color: k.color }}>
              {k.val}
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <SectionTitle>Issues by Category</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1a365d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <SectionTitle>Issues by Status</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                {byStatus.map((_, i) => (
                  <Cell key={i} fill={statusColors[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* City heatmap */}
      <SectionTitle>City Heatmap</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {CITIES.map((c) => {
          const ci = issues.filter((i) => i.city === c);
          const open = ci.filter((i) => i.status !== "Resolved").length;
          const crit = ci.filter((i) => i.severity === "Critical").length;
          const intensity = Math.min(100, open * 12 + crit * 8);
          const barColor = intensity > 70 ? "#dc2626" : intensity > 40 ? "#eab308" : "#059669";
          return (
            <Card key={c} className="p-5">
              <div className="font-semibold text-lg" style={{ color: "#1a365d" }}>
                {c}
              </div>
              <div className="text-xs text-slate-500 mb-3">{POPS[c]}</div>
              <div className="flex justify-between text-sm mb-1">
                <span>Open issues</span>
                <span className="font-semibold">{open}</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span>Critical alerts</span>
                <span className="font-semibold text-red-600">{crit}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{ width: `${intensity}%`, background: barColor }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1">Severity index: {intensity}/100</div>
            </Card>
          );
        })}
      </div>

      {/* Issues management */}
      <Card className="p-5 mb-4">
        <SectionTitle>Issues Management</SectionTitle>
        <div className="flex flex-wrap gap-2 mb-3 text-sm">
          {[
            { v: fCity, set: setFCity, opts: ["all", ...CITIES], label: "City" },
            { v: fCat, set: setFCat, opts: ["all", ...CATS], label: "Category" },
            { v: fSev, set: setFSev, opts: ["all", ...SEVS], label: "Severity" },
            { v: fStat, set: setFStat, opts: ["all", ...STATUSES], label: "Status" },
          ].map((f) => (
            <select
              key={f.label}
              value={f.v}
              onChange={(e) => {
                f.set(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              {f.opts.map((o) => (
                <option key={o} value={o}>
                  {o === "all" ? `All ${f.label}` : o}
                </option>
              ))}
            </select>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">City</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Summary</th>
                <th className="py-2 pr-3">Severity</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Reported</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((i) => (
                <tr key={i.id} className="border-b hover:bg-slate-50">
                  <td className="py-2 pr-3 font-mono text-xs">{i.id}</td>
                  <td className="py-2 pr-3">{i.city}</td>
                  <td className="py-2 pr-3">{i.category}</td>
                  <td className="py-2 pr-3 max-w-xs truncate">{i.title}</td>
                  <td className="py-2 pr-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor(i.severity)}`}>
                      {i.severity}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(i.status)}`}>
                      {i.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-xs text-slate-500">
                    {new Date(i.reportedAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      value={i.status}
                      onChange={(e) => {
                        updateIssue(i.id, { status: e.target.value as Status });
                        toast.success(`${i.id} → ${e.target.value}`);
                      }}
                      className="px-2 py-1 border border-slate-300 rounded text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No issues match filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="text-slate-500">
            Showing {pageItems.length} of {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* AI Policy Generator */}
      <Card className="p-5 mb-4">
        <SectionTitle>AI Policy Generator</SectionTitle>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={polCat}
            onChange={(e) => setPolCat(e.target.value as Category)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={generatePolicy}
            disabled={polLoading}
            className="px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 disabled:opacity-50"
            style={{ background: "#059669" }}
          >
            {polLoading ? <Spinner /> : <Sparkles className="w-4 h-4" />}
            Generate AI Policy Recommendation
          </button>
        </div>
        {polResp && (
          <div className="mt-4 p-4 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 whitespace-pre-wrap text-sm">
            {polResp}
          </div>
        )}
      </Card>

      {/* API Key Settings */}
      <Card className="p-5">
        <SectionTitle>OpenRouter API Key Settings</SectionTitle>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Enter OpenRouter API Key (sk-or-...)"
            className="flex-1 min-w-[260px] px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <button
            onClick={saveKey}
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ background: "#1a365d" }}
          >
            Save
          </button>
          <span
            className={`inline-flex items-center gap-1 text-sm font-medium ${apiKey ? "text-emerald-600" : "text-red-600"}`}
          >
            {apiKey ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {apiKey ? "Connected" : "Not Connected"}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Get a free key at aistudio.google.com. Stored only in your browser's localStorage.
        </p>
      </Card>
    </Layout>
  );
}
