import { useMemo, useRef, useState } from "react";
import { Send, AlertTriangle, Trash2, Home, Zap, Trees, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  callOpenRouter,
  useCityMind,
  type Category,
  type ChatMessage,
  type City,
  type Severity,
} from "@/lib/citymind";
import { Card, Layout, SectionTitle, Spinner, severityColor, statusColor } from "./Layout";

const categoryIcons: Record<Category, React.ComponentType<{ className?: string }>> = {
  Traffic: AlertTriangle,
  Waste: Trash2,
  Housing: Home,
  Energy: Zap,
  "Green Space": Trees,
};

const SYSTEM_PROMPT =
  "You are CityMind, an AI urban planning assistant for Pakistani cities. Help citizens with questions about traffic congestion, waste management, housing issues, energy problems, and urban development. Always relate answers to Vision 2030 goals. Be concise, helpful, and cite specific recommendations.";

export function UserDashboard() {
  const { city, setCity, issues, addIssue, apiKey, setApiKey } = useCityMind();
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Salam! I'm CityMind, your AI urban planning assistant. Ask me about traffic, waste, housing, energy, or green spaces in your city.",
      at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const cityIssues = useMemo(() => issues.filter((i) => i.city === city), [issues, city]);
  const openCount = cityIssues.filter((i) => i.status !== "Resolved").length;

  // form
  const [fCategory, setFCategory] = useState<Category>("Traffic");
  const [fDesc, setFDesc] = useState("");
  const [fWard, setFWard] = useState("");
  const [fSev, setFSev] = useState<Severity>("Medium");

  const send = async () => {
    const txt = input.trim();
    if (!txt || loading) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: txt,
      at: new Date().toISOString(),
    };
    setChat((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const reply = await callOpenRouter(apiKey, [
        { role: "system", content: SYSTEM_PROMPT + ` Citizen is asking about ${city}.` },
        ...chat.filter((m) => m.id !== "init").map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: txt },
      ]);
      setChat((p) => [
        ...p,
        { id: crypto.randomUUID(), role: "assistant", content: reply, at: new Date().toISOString() },
      ]);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const submitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fDesc.trim() || !fWard.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    addIssue({
      city,
      category: fCategory,
      title: fDesc.split(".")[0].slice(0, 80),
      description: fDesc,
      ward: fWard,
      severity: fSev,
      reporter: "Citizen",
    });
    toast.success("Issue reported successfully");
    setFDesc("");
    setFWard("");
    setFSev("Medium");
  };

  const recent = cityIssues.slice(0, 5);

  return (
    <Layout title="Welcome, Citizen" navLabel="My City Dashboard">
      <Card className="p-4 mb-4 border-emerald-200">
        <label className="text-sm font-semibold text-slate-700 block mb-2">
          Enter Anthropic API Key to activate AI
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span
            className={`px-3 py-2 rounded-lg text-xs font-medium ${
              apiKey ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {apiKey ? "AI Connected" : "Not Connected"}
          </span>
        </div>
      </Card>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">City:</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value as City)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option>Lahore</option>
          <option>Karachi</option>
          <option>Islamabad</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-5">
          <div className="text-xs text-slate-500 font-medium">OPEN ISSUES IN MY CITY</div>
          <div className="text-3xl font-bold mt-1" style={{ color: "#1a365d" }}>
            {openCount || 5}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-slate-500 font-medium">RESOLVED THIS MONTH</div>
          <div className="text-3xl font-bold mt-1 text-emerald-600">12</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-slate-500 font-medium">AI RECOMMENDATIONS MADE</div>
          <div className="text-3xl font-bold mt-1" style={{ color: "#1a365d" }}>
            48
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat */}
        <Card className="lg:col-span-2 flex flex-col h-[560px]">
          <div className="px-5 py-3 border-b flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <SectionTitle>AI Urban Assistant</SectionTitle>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
            {chat.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}
                  style={m.role === "user" ? { background: "#1a365d" } : undefined}
                >
                  <div>{m.content}</div>
                  <div className={`text-[10px] mt-1 ${m.role === "user" ? "text-white/60" : "text-slate-400"}`}>
                    {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 px-4 py-2 rounded-2xl text-slate-600 text-sm flex items-center gap-2">
                  <Spinner /> Thinking...
                </div>
              </div>
            )}
          </div>
          <div className="border-t p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about traffic, waste, housing, energy in your city..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 disabled:opacity-50"
              style={{ background: "#059669" }}
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </Card>

        {/* Report Issue */}
        <Card className="p-5">
          <SectionTitle>Report an Issue</SectionTitle>
          <form onSubmit={submitIssue} className="space-y-3 text-sm">
            <div>
              <label className="font-medium text-slate-700">Category</label>
              <select
                value={fCategory}
                onChange={(e) => setFCategory(e.target.value as Category)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option>Traffic</option>
                <option>Waste</option>
                <option>Housing</option>
                <option>Energy</option>
                <option>Green Space</option>
              </select>
            </div>
            <div>
              <label className="font-medium text-slate-700">Description</label>
              <textarea
                value={fDesc}
                onChange={(e) => setFDesc(e.target.value)}
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Describe the issue..."
              />
            </div>
            <div>
              <label className="font-medium text-slate-700">Ward / Area</label>
              <input
                value={fWard}
                onChange={(e) => setFWard(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. Ward 12, Gulberg"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700">Severity</label>
              <div className="flex gap-3 mt-1 flex-wrap">
                {(["Low", "Medium", "High", "Critical"] as Severity[]).map((s) => (
                  <label key={s} className="flex items-center gap-1 text-xs">
                    <input
                      type="radio"
                      name="sev"
                      checked={fSev === s}
                      onChange={() => setFSev(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-lg font-semibold text-white"
              style={{ background: "#1a365d" }}
            >
              Submit Report
            </button>
          </form>
        </Card>
      </div>

      {/* Recent Issues */}
      <Card className="mt-4 p-5">
        <SectionTitle>Recent Issues in {city}</SectionTitle>
        <div className="space-y-2">
          {recent.length === 0 && (
            <div className="text-sm text-slate-500">No issues reported in this city yet.</div>
          )}
          {recent.map((i) => {
            const Icon = categoryIcons[i.category];
            return (
              <div
                key={i.id}
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                  style={{ background: "#1a365d" }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#1a365d" }}>
                    {i.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {i.category} · {i.ward}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor(i.severity)}`}>
                  {i.severity}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(i.status)}`}>
                  {i.status}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </Layout>
  );
}
