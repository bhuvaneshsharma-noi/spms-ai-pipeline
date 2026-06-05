"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Types for each data category shown on the dashboard
interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  completed: boolean;
}

interface Exam {
  id: string;
  subject: string;
  date: string;
  time: string;
}

interface AttendanceRecord {
  subject: string;
  present: number;
  total: number;
}

interface TimetableSlot {
  day: string;
  subject: string;
  time: string;
}

// Dashboard summary card shown in the grid
function SummaryCard({
  title,
  value,
  subtitle,
  href,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div className={`rounded-xl p-6 shadow-sm border border-slate-100 bg-white hover:shadow-md transition-shadow cursor-pointer`}>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className={`text-3xl font-bold ${color} mb-2`}>{value}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from local JSON files on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [aRes, eRes, attRes, ttRes] = await Promise.all([
          fetch("/data/assignments.json").then((r) => r.ok ? r.json() : []),
          fetch("/data/exams.json").then((r) => r.ok ? r.json() : []),
          fetch("/data/attendance.json").then((r) => r.ok ? r.json() : []),
          fetch("/data/timetable.json").then((r) => r.ok ? r.json() : []),
        ]);
        setAssignments(aRes);
        setExams(eRes);
        setAttendance(attRes);
        // Filter timetable to show only today's classes
        const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
        setTodaySlots((ttRes as TimetableSlot[]).filter((s) => s.day === today));
      } catch {
        // Data files may not exist yet — start with empty state
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute summary values from loaded data
  const pendingAssignments = assignments.filter((a) => !a.completed).length;
  const upcomingExams = exams.filter(
    (e) => new Date(e.date) >= new Date()
  ).length;
  const avgAttendance =
    attendance.length > 0
      ? Math.round(
          attendance.reduce((sum, a) => sum + (a.total > 0 ? (a.present / a.total) * 100 : 0), 0) /
            attendance.length
        )
      : 0;

  // Find the soonest upcoming exam
  const nextExam = exams
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const daysUntilNextExam = nextExam
    ? Math.ceil(
        (new Date(nextExam.date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-lg animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <SummaryCard
          title="Pending Assignments"
          value={pendingAssignments}
          subtitle="assignments due"
          href="/assignments"
          color="text-orange-500"
        />
        <SummaryCard
          title="Upcoming Exams"
          value={upcomingExams}
          subtitle={nextExam ? `Next: ${nextExam.subject} in ${daysUntilNextExam}d` : "No exams scheduled"}
          href="/exams"
          color="text-red-500"
        />
        <SummaryCard
          title="Avg Attendance"
          value={`${avgAttendance}%`}
          subtitle={`across ${attendance.length} subjects`}
          href="/attendance"
          color={avgAttendance >= 75 ? "text-green-500" : "text-red-500"}
        />
        <SummaryCard
          title="Classes Today"
          value={todaySlots.length}
          subtitle={todaySlots.length > 0 ? `First: ${todaySlots[0].time}` : "No classes today"}
          href="/timetable"
          color="text-blue-500"
        />
      </div>

      {/* Two-column detail section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending assignments list */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Pending Assignments</h2>
          {assignments.filter((a) => !a.completed).length === 0 ? (
            <p className="text-slate-400 text-sm">No pending assignments. Great work!</p>
          ) : (
            <ul className="space-y-3">
              {assignments
                .filter((a) => !a.completed)
                .slice(0, 5)
                .map((a) => (
                  <li key={a.id} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{a.title}</p>
                      <p className="text-xs text-slate-400">{a.subject}</p>
                    </div>
                    <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                      {new Date(a.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Today's timetable */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Today&apos;s Timetable —{" "}
            {new Date().toLocaleDateString("en-US", { weekday: "long" })}
          </h2>
          {todaySlots.length === 0 ? (
            <p className="text-slate-400 text-sm">No classes scheduled for today.</p>
          ) : (
            <ul className="space-y-3">
              {todaySlots.map((slot, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-primary-600 bg-primary-50 px-2 py-1 rounded">
                    {slot.time}
                  </span>
                  <span className="text-sm text-slate-800">{slot.subject}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
