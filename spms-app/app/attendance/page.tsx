"use client";

import { useEffect, useState } from "react";

interface AttendanceRecord {
  id: string;
  subject: string;
  date: string;
  status: "Present" | "Absent" | "Late";
}

interface SubjectSummary {
  subject: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

const STATUS_COLORS = {
  Present: "bg-green-100 text-green-700",
  Absent: "bg-red-100 text-red-700",
  Late: "bg-yellow-100 text-yellow-700",
};

function generateId(): string { return `att-${Date.now()}`; }

function loadRecords(): AttendanceRecord[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem("spms-attendance"); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}

function saveRecords(data: AttendanceRecord[]): void {
  localStorage.setItem("spms-attendance", JSON.stringify(data));
}

function getSummaries(records: AttendanceRecord[]): SubjectSummary[] {
  const map: Record<string, SubjectSummary> = {};
  for (const r of records) {
    if (!map[r.subject]) map[r.subject] = { subject: r.subject, present: 0, absent: 0, late: 0, total: 0, percentage: 0 };
    map[r.subject].total++;
    if (r.status === "Present") map[r.subject].present++;
    else if (r.status === "Absent") map[r.subject].absent++;
    else if (r.status === "Late") map[r.subject].late++;
  }
  return Object.values(map).map((s) => ({ ...s, percentage: Math.round(((s.present + s.late) / s.total) * 100) }));
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"summary" | "log">("summary");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", date: new Date().toISOString().split("T")[0], status: "Present" as AttendanceRecord["status"] });

  useEffect(() => { setRecords(loadRecords()); setLoading(false); }, []);

  const summaries = getSummaries(records);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject) return;
    const updated = [...records, { ...form, id: generateId() }];
    setRecords(updated); saveRecords(updated);
    setForm({ subject: "", date: new Date().toISOString().split("T")[0], status: "Present" });
    setShowForm(false);
  }

  function deleteRecord(id: string) {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated); saveRecords(updated);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-500 animate-pulse">Loading...</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700">Attendance Tracker</h1>
          <p className="text-slate-500 mt-1">{records.length} total records · {summaries.length} subjects</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
          {showForm ? "Cancel" : "+ Mark Attendance"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">New Entry</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Subject *</label>
              <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. Physics" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AttendanceRecord["status"] })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option>Present</option><option>Absent</option><option>Late</option>
              </select></div>
          </div>
          <button type="submit" className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition-colors">Save</button>
        </form>
      )}

      <div className="flex gap-2 mb-6">
        {(["summary", "log"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50"}`}>{t === "summary" ? "Subject Summary" : "Full Log"}</button>
        ))}
      </div>

      {tab === "summary" && (
        summaries.length === 0
          ? <div className="text-center py-16 text-slate-400"><p className="text-lg">No records yet.</p></div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {summaries.sort((a, b) => a.percentage - b.percentage).map((s) => (
                <div key={s.subject} className={`bg-white rounded-xl shadow-sm border p-5 ${s.percentage < 75 ? "border-red-200" : "border-indigo-100"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-slate-800">{s.subject}</p>
                    <span className={`text-lg font-bold ${s.percentage < 75 ? "text-red-600" : "text-indigo-600"}`}>{s.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                    <div className={`h-2 rounded-full ${s.percentage < 75 ? "bg-red-400" : "bg-indigo-500"}`} style={{ width: `${s.percentage}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Present: {s.present}</span><span>Late: {s.late}</span><span>Absent: {s.absent}</span>
                  </div>
                  {s.percentage < 75 && <p className="text-xs text-red-600 mt-2 font-medium">Warning: Below 75%</p>}
                </div>
              ))}
            </div>
      )}

      {tab === "log" && (
        records.length === 0
          ? <div className="text-center py-16 text-slate-400"><p>No records found.</p></div>
          : <div className="space-y-2">
              {[...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-indigo-100 p-4 flex items-center gap-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  <div className="flex-1"><p className="text-sm font-medium text-slate-800">{r.subject}</p><p className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                  <button onClick={() => deleteRecord(r.id)} className="text-slate-300 hover:text-red-400 transition-colors text-lg">&times;</button>
                </div>
              ))}
            </div>
      )}
    </div>
  );
}
