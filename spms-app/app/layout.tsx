import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPMS — Student Personal Management System",
  description: "Manage assignments, exams, attendance, timetable, and notes.",
};

// Top navigation links shared across all pages
const NAV_LINKS = [
  { href: "/",           label: "Dashboard"   },
  { href: "/assignments", label: "Assignments" },
  { href: "/exams",      label: "Exams"       },
  { href: "/attendance", label: "Attendance"  },
  { href: "/timetable",  label: "Timetable"   },
  { href: "/notes",      label: "Notes"       },
  { href: "/timer",     label: "Study Timer" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {/* Top navigation bar */}
        <nav className="bg-primary-700 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Brand */}
              <Link href="/" className="text-xl font-bold tracking-tight hover:text-primary-200 transition-colors">
                Student Personal Management System
              </Link>
              {/* Navigation links */}
              <div className="hidden md:flex space-x-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              {/* Mobile menu placeholder */}
              <div className="md:hidden text-sm text-primary-200">
                Student Portal
              </div>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 mt-16 py-6 text-center text-sm text-slate-500">
          SPMS — Student Personal Management System &copy; {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
