"use client";

import { useEffect, useState } from "react";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: "High" | "Medium" | "Low";
}

const EMPTY_FORM: Omit<Assignment, "id"> = {
  title: "", subject: "", description: "", dueDate: "", completed: false, priority: "Medium",
};

function generateId(): string { return `a-${Date.now()}`; }

function loadAssignments(): Assignment[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem("spms-assignments"); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}

function saveAssignments(data: Assignment[]): void {
  localStorage.setItem("spms-assignments", JSON.stringify(data));
}

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-green-100 text-green-700",
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filterSubject, setFilterSubject] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);

  useEffect(() => { setAssignments(loadAssignments()); setLoading(false); }, []);

  const subjects = ["All", ...Array.from(new Set(assignments.map((a) => a.subject))).filter(Boolean)];
  const filtered = filterSubject === "All" ? assignments : assignments.filter((a) => a.subject === filterSubject);

  function toggleComplete(id: string) {
    const updated = assignments.map((a) => a.id === id ? { ...a, completed: !a.completed } : a);
    setAssignments(updated); saveAssignments(updated);
  }

  function deleteAssignment(id: string) {
    const updated = assignments.filter((a) => a.id !== id);
    setAssignments(updated); saveAssignments(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.dueDate) return;
    const updated = [...assignments, { ...form, id: generateId() }];
    setAssignments(updated); saveAssignments(updated);
    setForm({ ...EMPTY_FORM }); setShowForm(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-500 animate-pulse">Loading...</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700">Assignments</h1>
          <p className="text-slate-500 mt-1">{assignments.filter((a) => !a.completed).length} pending · {assignments.filter((a) => a.completed).length} completed</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
          {showForm ? "Cancel" : "+ Add Assignment"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-700">New Assignment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Title *</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. Chapter 3 Problems" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Subject *</label>
              <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. Mathematics" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Due Date *</label>
              <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Assignment["priority"] })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option>High</option><option>Medium</option><option>Low</option>
              </select></div>
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition-colors">Save Assignment</button>
        </form>
      )}

      <div className="flex gap-2 flex-wrap mb-6">
        {subjects.map((s) => (
          <button key={s} onClick={() => setFilterSubject(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterSubject === s ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50"}`}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><p className="text-lg">No assignments found.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((a) => (
            <div key={a.id} className={`bg-white rounded-xl shadow-sm border p-4 flex items-start gap-4 ${a.completed ? "opacity-60 border-slate-100" : "border-indigo-100"}`}>
              <input type="checkbox" checked={a.completed} onChange={() => toggleComplete(a.id)} className="mt-1 h-4 w-4 cursor-pointer flex-shrink-0 accent-indigo-600" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className={`text-sm font-medium ${a.completed ? "line-through text-slate-400" : "text-slate-800"}`}>{a.title}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[a.priority]}`}>{a.priority}</span>
                </div>
                <p className="text-xs text-slate-400">{a.subject} · Due: {new Date(a.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <button onClick={() => deleteAssignment(a.id)} className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none">&times;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
