"use client";

import { useEffect, useState } from "react";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  completed: boolean;
  priority: "High" | "Medium" | "Low";
}

const EMPTY: Omit<Assignment, "id"> = { title: "", subject: "", dueDate: "", completed: false, priority: "Medium" };
const load = (): Assignment[] => { try { const r = localStorage.getItem("spms-assignments"); return r ? JSON.parse(r) : []; } catch { return []; } };
const save = (d: Assignment[]) => localStorage.setItem("spms-assignments", JSON.stringify(d));
const uid = () => `a-${Date.now()}`;
const COLORS: Record<string, string> = { High: "bg-red-100 text-red-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-green-100 text-green-700" };

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [ready, setReady] = useState(false);

  useEffect(() => { setItems(load()); setReady(true); }, []);

  const subjects = ["All", ...Array.from(new Set(items.map(a => a.subject))).filter(Boolean)];
  const visible = filter === "All" ? items : items.filter(a => a.subject === filter);

  const toggle = (id: string) => { const u = items.map(a => a.id === id ? { ...a, completed: !a.completed } : a); setItems(u); save(u); };
  const remove = (id: string) => { const u = items.filter(a => a.id !== id); setItems(u); save(u); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = [...items, { ...form, id: uid() }];
    setItems(u); save(u); setForm({ ...EMPTY }); setShowForm(false);
  };

  if (!ready) return <div className="flex items-center justify-center h-64"><p className="text-slate-500 animate-pulse">Loading...</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700">Assignments</h1>
          <p className="text-slate-500 mt-1">{items.filter(a => !a.completed).length} pending · {items.filter(a => a.completed).length} completed</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
          {showForm ? "Cancel" : "+ Add Assignment"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl border border-indigo-100 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Title *</label>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. Chapter 3" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Subject *</label>
              <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. Mathematics" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Due Date *</label>
              <input type="date" required value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Assignment["priority"] })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option>High</option><option>Medium</option><option>Low</option>
              </select></div>
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg">Save</button>
        </form>
      )}

      <div className="flex gap-2 flex-wrap mb-6">
        {subjects.map(s => <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50"}`}>{s}</button>)}
      </div>

      {visible.length === 0
        ? <div className="text-center py-16 text-slate-400">No assignments found.</div>
        : <div className="space-y-3">
            {[...visible].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(a => (
              <div key={a.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${a.completed ? "opacity-60 border-slate-100" : "border-indigo-100"}`}>
                <input type="checkbox" checked={a.completed} onChange={() => toggle(a.id)} className="h-4 w-4 accent-indigo-600 cursor-pointer flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${a.completed ? "line-through text-slate-400" : "text-slate-800"}`}>{a.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COLORS[a.priority]}`}>{a.priority}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{a.subject} · Due: {new Date(a.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <button onClick={() => remove(a.id)} className="text-slate-300 hover:text-red-400 text-lg">&times;</button>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
