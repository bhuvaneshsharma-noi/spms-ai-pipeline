"use client";

import { useEffect, useState } from "react";

interface AttendanceRecord {
  subject: string;
  present: number;
  absent: number;
}

function loadAttendance(): AttendanceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("spms-attendance");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAttendance(data: AttendanceRecord[]): void {
  localStorage.setItem("spms-attendance", JSON.stringify(data));
}

// Calculate attendance percentage for one record
function percentage(record: AttendanceRecord): number {
  const total = record.present + record.absent;
  if (total === 0) return 0;
  return Math.round((record.present / total) * 100);
}

// Return Tailwind colour classes based on attendance percentage
function statusColor(pct: number): { bar: string; text: string; badge: string } {
  if (pct >= 75) return { bar: "bg-green-500", text: "text-green-700", badge: "bg-green-100 text-green-700" };
  if (pct >= 60) return { bar: "bg-yellow-400", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" };
  return { bar: "bg-red-500", text: "text-red-700", badge: "bg-red-100 text-red-700" };
}

// Classes still needed to reach 75% attendance
function classesNeeded(record: AttendanceRecord): number {
  const pct = percentage(record);
  if (pct >= 75) return 0;
  const total = record.present + record.absent;
  // Solve: present / (total + x) = 0.75  →  x = (0.75*total - present) / 0.25
  const needed = Math.ceil((0.75 * total - record.present) / 0.25);
  return Math.max(0, needed);
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRecords(loadAttendance());
    setLoading(false);
  }, []);

  // Add a new subject with zero attendance
  function addSubject() {
    const name = newSubject.trim();
    if (!name) return;
    if (records.some((r) => r.subject.toLowerCase() === name.toLowerCase())) return;
    const updated = [...records, { subject: name, present: 0, absent: 0 }];
    setRecords(updated);
    saveAttendance(updated);
    setNewSubject("");
  }

  // Record a present or absent entry for a subject
  function markAttendance(subject: string, type: "present" | "absent") {
    const updated = records.map((r) =>
      r.subject === subject ? { ...r, [type]: r[type] + 1 } : r
    );
    setRecords(updated);
    saveAttendance(updated);
  }

  // Undo the last attendance entry
  function undoLast(subject: string, type: "present" | "absent") {
    const updated = records.map((r) =>
      r.subject === subject ? { ...r, [type]: Math.max(0, r[type] - 1) } : r
    );
    setRecords(updated);
    saveAttendance(updated);
  }

  // Remove a subject entirely
  function removeSubject(subject: string) {
    const updated = records.filter((r) => r.subject !== subject);
    setRecords(updated);
    saveAttendance(updated);
  }

  // Overall average across all subjects
  const overall =
    records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + percentage(r), 0) / records.length)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 animate-pulse">Loading attendance...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Attendance</h1>
        <p className="text-slate-500 mt-1">
          Overall average: {" "}
          <span className={`font-semibold ${statusColor(overall).text}`}>{overall}%</span>
          {" "}&bull; {records.length} subjects tracked
        </p>
      </div>

      {/* Add subject input */}
      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSubject()}
          placeholder="Add a new subject, e.g. Physics"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <button
          onClick={addSubject}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          + Add Subject
        </button>
      </div>

      {/* Subject attendance cards */}
      {records.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No subjects added yet.</p>
          <p className="text-sm mt-1">Add a subject above to start tracking attendance.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const pct = percentage(record);
            const total = record.present + record.absent;
            const colors = statusColor(pct);
            const needed = classesNeeded(record);
            return (
              <div
                key={record.subject}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-5"
              >
                {/* Subject name and percentage */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-slate-800">{record.subject}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {pct}%
                    </span>
                    {needed > 0 && (
                      <span className="text-xs text-red-500">
                        Need {needed} more to reach 75%
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeSubject(record.subject)}
                    className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                    title="Remove subject"
                  >
                    &times;
                  </button>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-slate-100 rounded-full mb-3 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${colors.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Stats and action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span>
                      <span className="text-green-600 font-semibold">{record.present}</span> present
                    </span>
                    <span>
                      <span className="text-red-500 font-semibold">{record.absent}</span> absent
                    </span>
                    <span>{total} total</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => undoLast(record.subject, "present")}
                      className="text-xs px-2 py-1 text-slate-400 hover:text-slate-600 border border-slate-200 rounded transition-colors"
                      title="Undo last present"
                    >
                      ↩ P
                    </button>
                    <button
                      onClick={() => undoLast(record.subject, "absent")}
                      className="text-xs px-2 py-1 text-slate-400 hover:text-slate-600 border border-slate-200 rounded transition-colors"
                      title="Undo last absent"
                    >
                      ↩ A
                    </button>
                    <button
                      onClick={() => markAttendance(record.subject, "absent")}
                      className="px-3 py-1.5 text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => markAttendance(record.subject, "present")}
                      className="px-3 py-1.5 text-sm font-medium bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                    >
                      Present
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
