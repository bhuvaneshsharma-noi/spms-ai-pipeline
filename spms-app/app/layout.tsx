import type { Metadata } from "next";
import Sidebar from "./components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPMS — Student Personal Management System",
  description: "Manage assignments, exams, attendance, timetable, and notes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex">
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <footer className="border-t border-slate-200 py-4 text-center text-sm text-slate-500">
            SPMS — Student Personal Management System &copy; {new Date().getFullYear()}
          </footer>
        </div>
      </body>
    </html>
  );
}
