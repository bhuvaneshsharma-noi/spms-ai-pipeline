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

// Empty assignment template used when creating a new one
const EMPTY_FORM: Omit<Assignment, "id"> = {
  title: "",
  subject: "",
  description: "",
  dueDate: "",
  completed: false,
  priority: "Medium",
};

// Generate a simple unique ID for new assignments
function generateId(): string {
  return `a-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Load assignments from localStorage (falls back to empty array)
function loadAssignments(): Assignment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("spms-assignments");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save assignments to localStorage
function saveAssignments(data: Assignment[]): void {
  localStorage.setItem("spms-assignments", JSON.stringify(data));
}

// Priority badge colours
const PRIORITY_COLORS: Record<string, string> = {
  High:   "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low:    "bg-green-100 text-green-700",
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filterSubject, setFilterSubject] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);

  // Load from localStorage on first render
  useEffect(() => {
    setAssignments(loadAssignments());
    setLoading(false);
  }, []);

  // Derive unique subject list for the filter dropdown
  const subjects = ["All", ...Array.from(new Set(assignments.map((a) => a.subject))).filter(Boolean)];

  // Filtered view based on selected subject
  const filtered = filterSubject === "All"
    ? assignments
    : assignments.filter((a) => a.subject === filterSubject);

  // Toggle completion status for an assignment
  function toggleComplete(id: string) {
    const updated = assignments.map((a) =>
      a.id === id ? { ...a, completed: !a.completed } : a
    );
    setAssignments(updated);
    saveAssignments(updated);
  }

  // Delete an assignment by id
  function deleteAssignment(id: string) {
    const updated = assignments.filter((a) => a.id !== id);
    setAssignments(updated);
    saveAssignments(updated);
  }

  // Add a new assignment from the form
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.dueDate) return;
    const newAssignment: Assignment = { ...form, id: generateId() };
    const updated = [...assignments, newAssignment];
    setAssignments(updated);
    saveAssignments(updated);
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 animate-pulse">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Assignments</h1>
          <p className="text-slate-500 mt-1">
            {assignments.filter((a) => !a.completed).length} pending &bull;{" "}
            {assignments.filter((a) => a.completed).length} completed
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Assignment"}
        </button>
      </div>

      {/* Add assignment form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-700">New Assignment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="e.g. Chapter 3 Problems"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="e.g. Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Assignment["priority"] })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="Optional details about the assignment..."
            />
          </div>
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Save Assignment
          </button>
        </form>
      )}

      {/* Subject filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setFilterSubject(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterSubject === s
                ? "bg-primary-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Assignment list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No assignments found.</p>
          <p className="text-sm mt-1">Add your first assignment using the button above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .map((a) => (
              <div
                key={a.id}
                className={`bg-white rounded-xl shadow-sm border p-4 flex items-start gap-4 transition-opacity ${
                  a.completed ? "opacity-60 border-slate-100" : "border-slate-100"
                }`}
              >
                {/* Completion checkbox */}
                <input
                  type="checkbox"
                  checked={a.completed}
                  onChange={() => toggleComplete(a.id)}
                  className="mt-1 h-4 w-4 accent-primary-600 cursor-pointer flex-shrink-0"
                />
                {/* Assignment details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className={`text-sm font-medium ${a.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {a.title}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[a.priority]}`}>
                      {a.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {a.subject} &bull; Due:{" "}
                    {new Date(a.dueDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {a.description && (
                    <p className="text-xs text-slate-500 mt-1">{a.description}</p>
                  )}
                </div>
                {/* Delete button */}
                <button
                  onClick={() => deleteAssignment(a.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none"
                  title="Delete assignment"
                >
                  &times;
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
