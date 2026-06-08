import type { Metadata } from "next";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
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
        <div className="flex-1 flex flex-col min-h-screen">
          <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
