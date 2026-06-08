"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/",            label: "Dashboard",   icon: "⊞" },
  { href: "/assignments", label: "Assignments",  icon: "✎" },
  { href: "/exams",       label: "Exams",        icon: "📋" },
  { href: "/attendance",  label: "Attendance",   icon: "✓" },
  { href: "/timetable",   label: "Timetable",    icon: "📅" },
  { href: "/notes",       label: "Notes",        icon: "📝" },
  { href: "/timer",       label: "Study Timer",  icon: "⏱" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={`bg-primary-700 text-white sticky top-0 h-screen flex-shrink-0 flex flex-col transition-all duration-300 ${
        open ? "w-56" : "w-14"
      }`}
    >
      {/* Brand + toggle button */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-primary-600">
        {open && (
          <span className="text-xs font-bold leading-tight">
            Student Personal<br />Management System
          </span>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="ml-auto flex-shrink-0 text-primary-200 hover:text-white text-xl leading-none px-1"
          title={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? "‹" : "›"}
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 mt-2 overflow-y-auto">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-primary-600 transition-colors"
            title={!open ? link.label : undefined}
          >
            <span className="text-base flex-shrink-0 w-5 text-center">{link.icon}</span>
            {open && <span>{link.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
