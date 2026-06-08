export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to SPMS</h1>
      <p className="text-slate-500">Student Personal Management System — manage your academic life efficiently.</p>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { href: "/assignments", label: "Assignments", icon: "✎", color: "bg-blue-50 text-blue-700" },
          { href: "/exams",       label: "Exams",       icon: "📋", color: "bg-purple-50 text-purple-700" },
          { href: "/attendance",  label: "Attendance",  icon: "✓",  color: "bg-green-50 text-green-700" },
          { href: "/timetable",   label: "Timetable",   icon: "📅", color: "bg-yellow-50 text-yellow-700" },
          { href: "/notes",       label: "Notes",       icon: "📝", color: "bg-orange-50 text-orange-700" },
          { href: "/timer",       label: "Study Timer", icon: "⏱", color: "bg-red-50 text-red-700" },
        ].map((item) => (
          <a key={item.href} href={item.href} className={`${item.color} rounded-xl p-6 flex flex-col items-center gap-2 hover:shadow-md transition-shadow`}>
            <span className="text-3xl">{item.icon}</span>
            <span className="font-semibold text-sm">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
