import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/assignments", label: "Assignments" },
  { href: "/exams", label: "Exams" },
  { href: "/attendance", label: "Attendance" },
  { href: "/timetable", label: "Timetable" },
  { href: "/notes", label: "Notes" },
];

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <span className="text-lg font-bold text-indigo-700">SPMS</span>
      <div className="flex gap-6">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-gray-600 hover:text-indigo-700 transition-colors"
          >
            {link.label}
          </Link>
        ))}
        <button className="text-sm font-medium text-gray-600 hover:text-indigo-700 transition-colors">
          Logout
        </button>
        <button className="text-sm font-medium text-gray-600 hover:text-indigo-700 transition-colors">
          🔔
        </button>
      </div>
    </nav>
  );
}
