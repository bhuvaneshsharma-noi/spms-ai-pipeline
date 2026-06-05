"use client";

import { useEffect, useState } from "react";

interface Exam {
  id: string;
  subject: string;
  date: string;
  time: string;
  location: string;
  notes: string;
}

const EMPTY_FORM: Omit<Exam, "id"> = {
  subject: "",
  date: "",
  time: "",
  location: "",
  notes: "",
};

function generateId(): string {
  return `e-${Date.now()}`;
}

function loadExams(): Exam[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("spms-exams");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExams(data: Exam[]): void {
  localStorage.setItem("spms-exams", JSON.stringify(data));
}

// Calculate how many days until an exam date
function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Return colour class based on how soon the exam is
function urgencyColor(days: number): string {
  if (days < 0)  return "text-slate-400";
  if (days <= 3)  return "text-red-600";
  if (days <= 7)  return "text-orange-500";
  return "text-green-600";
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  useEffect(() => {
    setExams(loadExams());
    setLoading(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject || !form.date) return;
    const newExam: Exam = { ...form, id: generateId() };
    const updated = [...exams, newExam].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setExams(updated);
    saveExams(updated);
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  }

  function deleteExam(id: string) {
    const updated = exams.filter((e) => e.id !== id);
    setExams(updated);
    saveExams(updated);
  }

  const upcoming = exams.filter((e) => daysUntil(e.date) >= 0);
  const past = exams.filter((e) => daysUntil(e.date) < 0);
  const nextExam = upcoming[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 animate-pulse">Loading exams...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Exams</h1>
          <p className="text-slate-500 mt-1">
            {upcoming.length} upcoming &bull; {past.length} past
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {viewMode === "list" ? "Calendar View" : "List View"}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Exam"}
          </button>
        </div>
      </div>

      {/* Countdown banner for next exam */}
      {nextExam && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-700">Next Exam</p>
            <p className="text-lg font-bold text-primary-800 mt-0.5">
              {nextExam.subject}
            </p>
            <p className="text-sm text-primary-600">
              {new Date(nextExam.date).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              {nextExam.time && `at ${nextExam.time}`}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-bold ${urgencyColor(daysUntil(nextExam.date))}`}>
              {daysUntil(nextExam.date)}
            </p>
            <p className="text-sm text-slate-500">days to go</p>
          </div>
        </div>
      )}

      {/* Add exam form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-700">New Exam</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="e.g. Physics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="e.g. Hall A, Room 201"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="Topics covered, allowed materials, etc."
            />
          </div>
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Save Exam
          </button>
        </form>
      )}

      {/* Exam list */}
      {exams.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No exams added yet.</p>
          <p className="text-sm mt-1">Click &quot;+ Add Exam&quot; to get started.</p>
        </div>
      ) : (
        <div>
          {upcoming.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Upcoming
              </h2>
              <div className="space-y-3">
                {upcoming.map((exam) => {
                  const days = daysUntil(exam.date);
                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-start justify-between gap-4"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{exam.subject}</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {new Date(exam.date).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {exam.time && ` at ${exam.time}`}
                          {exam.location && ` — ${exam.location}`}
                        </p>
                        {exam.notes && (
                          <p className="text-xs text-slate-400 mt-1">{exam.notes}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-2xl font-bold ${urgencyColor(days)}`}>{days}d</p>
                        <button
                          onClick={() => deleteExam(exam.id)}
                          className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Past
              </h2>
              <div className="space-y-2 opacity-60">
                {past.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white rounded-lg border border-slate-100 px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-600 line-through">{exam.subject}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(exam.date).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteExam(exam.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
