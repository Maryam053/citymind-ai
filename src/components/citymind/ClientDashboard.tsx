import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";
import { callOpenRouter, useCityMind, type Status } from "@/lib/citymind";
import { Card, Layout, SectionTitle, Spinner, severityColor } from "./Layout";

const DEPARTMENTS = [
  { name: "Water & Sanitation", open: 18 },
  { name: "Traffic Police", open: 24 },
  { name: "Energy & Power", open: 11 },
  { name: "Housing Authority", open: 9 },
  { name: "Parks & Horticulture", open: 7 },
];

const RESOLUTION_TREND = [
  { month: "Jan", days: 6.1 },
  { month: "Feb", days: 5.5 },
  { month: "Mar", days: 5.0 },
  { month: "Apr", days: 4.6 },
  { month: "May", days: 4.4 },
  { month: "Jun", days: 4.2 },
];

const FLOW_DATA = [
  { month: "Jan", received: 42, resolved: 28 },
  { month: "Feb", received: 38, resolved: 30 },
  { month: "Mar", received: 51, resolved: 41 },
  { month: "Apr", received: 47, resolved: 39 },
  { month: "May", received: 55, resolved: 48 },
  { month: "Jun", received: 49, resolved: 45 },
];

export function ClientDashboard() {
  const { issues, updateIssue, apiKey } = useCityMind();
  const assigned = useMemo(() => issues.slice(0, 12), [issues]);

  const [plannerInput, setPlannerInput] = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const [plan, setPlan] = useState("");

  const generatePlan = async () => {
    if (!plannerInput.trim()) return;
    setPlanLoading(true);
    setPlan("");
    try {
      const reply = await callOpenRouter(apiKey, [
        {
          role: "user",
          content: `You are an expert urban development consultant for Pakistan. Create a detailed project implementation plan for: ${plannerInput}. Include phases, budget range in PKR, required departments, KPIs, and how this aligns with Vision 2030 and SDG 11.`,
        },
      ]);
      setPlan(reply);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPlanLoading(false);
    }
  };

  // Update modal
  const [updateOpen, setUpdateOpen] = useState<string | null>(null);
  const [updateText, setUpdateText] = useState("");
  const saveUpdate = () => {
    if (updateOpen && updateText.trim()) {
      const i = issues.find((x) => x.id === updateOpen);
      updateIssue(updateOpen, {
        updates: [...(i?.updates ?? []), { at: new Date().toISOString(), text: updateText }],
      });
      toast.success("Update added");
    }
    setUpdateOpen(null);
    setUpdateText("");
  };

  // Collab modal
  const [collabDept, setCollabDept] = useState<string | null>(null);
  const [collabMsg, setCollabMsg] = useState("");
  const sendCollab = () => {
    if (collabMsg.trim()) toast.success(`Collaboration request sent to ${collabDept}`);
    setCollabDept(null);
    setCollabMsg("");
  };

  return (
    <Layout
      title="Municipal Partner Portal — Department of Urban Affairs"
      navLabel="Department Console"
    >
      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Assigned Issues", val: 34, color: "#1a365d" },
          { label: "Pending Action", val: 12, color: "#dc2626" },
          { label: "Avg Resolution Time", val: "4.2d", color: "#1a365d" },
          { label: "Citizen Satisfaction", val: "78%", color: "#059669" },
        ].map((k) => (
          <Card key={k.label} className="p-5">
            <div className="text-xs text-slate-500 font-medium uppercase">{k.label}</div>
            <div className="text-3xl font-bold mt-1" style={{ color: k.color }}>
              {k.val}
            </div>
          </Card>
        ))}
      </div>

      {/* AI Project Planner */}
      <Card className="p-5 mb-4">
        <SectionTitle>AI Project Planner</SectionTitle>
        <textarea
          value={plannerInput}
          onChange={(e) => setPlannerInput(e.target.value)}
          rows={3}
          placeholder="Describe your urban project or challenge..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <button
          onClick={generatePlan}
          disabled={planLoading}
          className="mt-3 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 disabled:opacity-50"
          style={{ background: "#059669" }}
        >
          {planLoading ? <Spinner /> : <Sparkles className="w-4 h-4" />}
          Generate Project Plan with AI
        </button>
        {plan && (
          <div className="mt-4 p-4 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 whitespace-pre-wrap text-sm">
            {plan}
          </div>
        )}
      </Card>

      {/* Assigned Issues */}
      <Card className="p-5 mb-4">
        <SectionTitle>Assigned Issues</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-3">Issue ID</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Location</th>
                <th className="py-2 pr-3">Severity</th>
                <th className="py-2 pr-3">Days Open</th>
                <th className="py-2 pr-3">Reports</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {assigned.map((i) => {
                const days = Math.max(
                  1,
                  Math.floor((Date.now() - new Date(i.reportedAt).getTime()) / 86400000),
                );
                return (
                  <tr key={i.id} className="border-b hover:bg-slate-50">
                    <td className="py-2 pr-3 font-mono text-xs">{i.id}</td>
                    <td className="py-2 pr-3">{i.category}</td>
                    <td className="py-2 pr-3 text-xs">
                      {i.city} · {i.ward}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor(i.severity)}`}>
                        {i.severity}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{days}d</td>
                    <td className="py-2 pr-3">{1 + (parseInt(i.id.slice(-2)) % 8)}</td>
                    <td className="py-2 pr-3 flex gap-1 flex-wrap">
                      <button
                        onClick={() => {
                          updateIssue(i.id, { status: "Resolved" as Status });
                          toast.success(`${i.id} marked resolved`);
                        }}
                        className="px-2 py-1 rounded text-xs text-white"
                        style={{ background: "#059669" }}
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => setUpdateOpen(i.id)}
                        className="px-2 py-1 rounded text-xs border border-slate-300"
                      >
                        Add Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <SectionTitle>Resolution Time Trend (last 6 months)</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={RESOLUTION_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="d" />
              <Tooltip />
              <Line type="monotone" dataKey="days" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <SectionTitle>Issues Received vs Resolved</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={FLOW_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="received" fill="#1a365d" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Collaboration */}
      <Card className="p-5">
        <SectionTitle>Collaboration Panel</SectionTitle>
        <div className="space-y-2">
          {DEPARTMENTS.map((d) => (
            <div
              key={d.name}
              className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
            >
              <div>
                <div className="font-medium text-sm" style={{ color: "#1a365d" }}>
                  {d.name}
                </div>
                <div className="text-xs text-slate-500">{d.open} open issues</div>
              </div>
              <button
                onClick={() => setCollabDept(d.name)}
                className="px-3 py-1.5 rounded text-xs text-white"
                style={{ background: "#1a365d" }}
              >
                Request Collaboration
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Update modal */}
      {updateOpen && (
        <Modal title={`Add Update — ${updateOpen}`} onClose={() => setUpdateOpen(null)}>
          <textarea
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            rows={4}
            placeholder="Describe the update..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <button
            onClick={saveUpdate}
            className="mt-3 w-full py-2 rounded-lg text-white font-medium"
            style={{ background: "#059669" }}
          >
            Save Update
          </button>
        </Modal>
      )}

      {collabDept && (
        <Modal
          title={`Request Collaboration — ${collabDept}`}
          onClose={() => setCollabDept(null)}
        >
          <textarea
            value={collabMsg}
            onChange={(e) => setCollabMsg(e.target.value)}
            rows={4}
            placeholder="Describe what you need help with..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <button
            onClick={sendCollab}
            className="mt-3 w-full py-2 rounded-lg text-white font-medium"
            style={{ background: "#1a365d" }}
          >
            Send Request
          </button>
        </Modal>
      )}
    </Layout>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: "#1a365d" }}>
            {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
