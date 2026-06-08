"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/",            label: "Dashboard",  icon: "⊞" },
  { href: "/assignments", label: "Assignments", icon: "✎" },
  { href: "/exams",       label: "Exams",       icon: "📋" },
  { href: "/attendance",  label: "Attendance",  icon: "✓" },
  { href: "/timetable",   label: "Timetable",   icon: "📅" },
  { href: "/notes",       label: "Notes",       icon: "📝" },
  { href: "/timer",       label: "Study Timer", icon: "⏱" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <aside className={`bg-slate-800 text-white sticky top-0 h-screen flex-shrink-0 flex flex-col transition-all duration-300 ${open ? "w-56" : "w-14"}`}>
      <div className="flex items-center justify-between px-3 py-4 border-b border-slate-700">
        {open && <span className="text-xs font-bold leading-tight">Student Personal<br />Management System</span>}
        <button onClick={() => setOpen(!open)} className="ml-auto text-slate-300 hover:text-white text-xl px-1" title={open ? "Collapse" : "Expand"}>
          {open ? "‹" : "›"}
        </button>
      </div>
      <nav className="flex-1 mt-2">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors"
            title={!open ? link.label : undefined}>
            <span className="text-base w-5 text-center flex-shrink-0">{link.icon}</span>
            {open && <span>{link.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
