"use client";

import { useEffect, useState } from "react";

interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

const EMPTY_FORM: Omit<TimetableSlot, "id"> = {
  day: "Monday",
  startTime: "09:00",
  endTime: "10:00",
  subject: "",
  teacher: "",
  room: "",
};

function generateId(): string {
  return `tt-${Date.now()}`;
}

function loadTimetable(): TimetableSlot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("spms-timetable");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTimetable(data: TimetableSlot[]): void {
  localStorage.setItem("spms-timetable", JSON.stringify(data));
}

// Return the slots for a specific day, sorted by start time
function slotsForDay(slots: TimetableSlot[], day: string): TimetableSlot[] {
  return slots
    .filter((s) => s.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// Generate a pastel background colour from a subject name
function subjectColor(subject: string): string {
  const colors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-teal-100 text-teal-800 border-teal-200",
  ];
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash += subject.charCodeAt(i);
  return colors[hash % colors.length];
}

export default function TimetablePage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>("");

  useEffect(() => {
    setSlots(loadTimetable());
    // Default to today's day name
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    setActiveDay(DAYS.includes(today) ? today : "Monday");
    setLoading(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject) return;
    const newSlot: TimetableSlot = { ...form, id: generateId() };
    const updated = [...slots, newSlot];
    setSlots(updated);
    saveTimetable(updated);
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  }

  function deleteSlot(id: string) {
    const updated = slots.filter((s) => s.id !== id);
    setSlots(updated);
    saveTimetable(updated);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 animate-pulse">Loading timetable...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Timetable</h1>
          <p className="text-slate-500 mt-1">Weekly class schedule</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Class"}
        </button>
      </div>

      {/* Add class form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-700">New Class Slot</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Day</label>
              <select
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {DAYS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Start Time</label>
              <select
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">End Time</label>
              <select
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
              </select>
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
              <label className="block text-sm font-medium text-slate-600 mb-1">Teacher</label>
              <input
                type="text"
                value={form.teacher}
                onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="e.g. Dr. Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Room</label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="e.g. Room 204"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Add to Timetable
          </button>
        </form>
      )}

      {/* Day tabs */}
      <div className="flex gap-1 flex-wrap mb-6">
        {DAYS.map((day) => {
          const count = slotsForDay(slots, day).length;
          const isToday = day === new Date().toLocaleDateString("en-US", { weekday: "long" });
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeDay === day
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 3)}</span>
              {isToday && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full" />
              )}
              {count > 0 && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeDay === day ? "bg-primary-500" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day schedule */}
      <div>
        {slotsForDay(slots, activeDay).length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-100">
            <p className="text-lg">No classes on {activeDay}.</p>
            <p className="text-sm mt-1">Click &quot;+ Add Class&quot; to add one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slotsForDay(slots, activeDay).map((slot) => (
              <div
                key={slot.id}
                className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${subjectColor(slot.subject)}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[72px]">
                    <p className="text-xs font-mono font-semibold">{slot.startTime}</p>
                    <p className="text-xs text-slate-500">to</p>
                    <p className="text-xs font-mono font-semibold">{slot.endTime}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{slot.subject}</p>
                    <p className="text-xs mt-0.5">
                      {slot.teacher && `${slot.teacher}`}
                      {slot.teacher && slot.room && " · "}
                      {slot.room && slot.room}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteSlot(slot.id)}
                  className="opacity-50 hover:opacity-100 transition-opacity text-lg leading-none"
                  title="Remove slot"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
