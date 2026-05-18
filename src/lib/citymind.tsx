import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "user" | "admin" | "client";
export type City = "Lahore" | "Karachi" | "Islamabad";
export type Category = "Traffic" | "Waste" | "Housing" | "Energy" | "Green Space";
export type Severity = "Low" | "Medium" | "High" | "Critical";
export type Status = "Open" | "In Progress" | "Resolved";

export interface User {
  email: string;
  role: Role;
  name: string;
}

export interface Issue {
  id: string;
  city: City;
  category: Category;
  title: string;
  description: string;
  ward: string;
  severity: Severity;
  status: Status;
  reportedAt: string;
  reporter: string;
  updates?: { at: string; text: string }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  at: string;
}

interface CityMindState {
  user: User | null;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  city: City;
  setCity: (c: City) => void;
  issues: Issue[];
  addIssue: (issue: Omit<Issue, "id" | "reportedAt" | "status">) => Issue;
  updateIssue: (id: string, patch: Partial<Issue>) => void;
  apiKey: string;
  setApiKey: (k: string) => void;
}

const CityMindContext = createContext<CityMindState | null>(null);

const CREDENTIALS: Record<string, { password: string; user: User }> = {
  "user@citymind.pk": { password: "user123", user: { email: "user@citymind.pk", role: "user", name: "Citizen" } },
  "admin@citymind.pk": { password: "admin123", user: { email: "admin@citymind.pk", role: "admin", name: "Admin" } },
  "client@citymind.pk": { password: "client123", user: { email: "client@citymind.pk", role: "client", name: "Municipal Partner" } },
};

const seedIssues = (): Issue[] => {
  const cities: City[] = ["Lahore", "Karachi", "Islamabad"];
  const cats: Category[] = ["Traffic", "Waste", "Housing", "Energy", "Green Space"];
  const sevs: Severity[] = ["Low", "Medium", "High", "Critical"];
  const stats: Status[] = ["Open", "In Progress", "Resolved"];
  const titles = [
    "Heavy congestion on main road",
    "Garbage not collected in 5 days",
    "Streetlight outage on block",
    "Sewerage overflow near market",
    "Illegal construction reported",
    "Power outage in sector",
    "Park not maintained, trees dying",
    "Potholes damaging vehicles",
    "Water shortage in neighborhood",
    "Air quality alarmingly poor",
    "Noise pollution from factory",
    "Bus stop shelter damaged",
    "Open manhole hazard",
    "Smog reducing visibility",
    "Encroachment on green belt",
  ];
  return titles.map((t, i) => ({
    id: `IS-${1001 + i}`,
    city: cities[i % 3],
    category: cats[i % cats.length],
    title: t,
    description: t + " requires urgent municipal review and action.",
    ward: `Ward ${10 + (i % 12)}`,
    severity: sevs[i % sevs.length],
    status: stats[i % stats.length],
    reportedAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    reporter: i % 2 === 0 ? "Citizen" : "Field Officer",
  }));
};

const LS_USER = "citymind:user";
const LS_ISSUES = "citymind:issues";
const LS_KEY = "citymind_api_key";
const LS_CITY = "citymind:city";

export function CityMindProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [city, setCityState] = useState<City>("Lahore");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [apiKey, setApiKeyState] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem(LS_USER);
      if (u) setUser(JSON.parse(u));
      const i = localStorage.getItem(LS_ISSUES);
      setIssues(i ? JSON.parse(i) : seedIssues());
      const k = localStorage.getItem(LS_KEY);
      if (k) setApiKeyState(k);
      const c = localStorage.getItem(LS_CITY);
      if (c) setCityState(c as City);
    } catch {
      setIssues(seedIssues());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(LS_ISSUES, JSON.stringify(issues));
  }, [issues, hydrated]);

  const login = (email: string, password: string) => {
    const rec = CREDENTIALS[email.toLowerCase().trim()];
    if (rec && rec.password === password) {
      setUser(rec.user);
      localStorage.setItem(LS_USER, JSON.stringify(rec.user));
      return rec.user;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_USER);
  };

  const setCity = (c: City) => {
    setCityState(c);
    localStorage.setItem(LS_CITY, c);
  };

  const setApiKey = (k: string) => {
    setApiKeyState(k);
    localStorage.setItem(LS_KEY, k);
  };

  const addIssue = (data: Omit<Issue, "id" | "reportedAt" | "status">) => {
    const newIssue: Issue = {
      ...data,
      id: `IS-${Date.now().toString().slice(-6)}`,
      reportedAt: new Date().toISOString(),
      status: "Open",
    };
    setIssues((prev) => [newIssue, ...prev]);
    return newIssue;
  };

  const updateIssue = (id: string, patch: Partial<Issue>) => {
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  return (
    <CityMindContext.Provider
      value={{ user, login, logout, city, setCity, issues, addIssue, updateIssue, apiKey, setApiKey }}
    >
      {children}
    </CityMindContext.Provider>
  );
}

export function useCityMind() {
  const ctx = useContext(CityMindContext);
  if (!ctx) throw new Error("useCityMind must be used within CityMindProvider");
  return ctx;
}

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function callGemini(
  apiKey: string,
  messages: { role: string; content: string }[],
): Promise<string> {
  const key =
    apiKey ||
    (typeof window !== "undefined" ? localStorage.getItem("citymind_api_key") || "" : "");
  if (!key)
    throw new Error(
      "Gemini API key not set. Paste your key at the top of the dashboard to activate AI.",
    );

  const systemPrompt = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n");
  const convo = messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");
  const text = systemPrompt + "\n\n" + convo;

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error("Gemini returned empty response");
  return reply;
}

// Backwards-compat alias so existing call sites keep working.
export const callOpenRouter = callGemini;
