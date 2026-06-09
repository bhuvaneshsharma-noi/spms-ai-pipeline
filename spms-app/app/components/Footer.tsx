const Footer = () => {
  return (
    <footer className="bg-indigo-900 text-white py-6 px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="font-semibold text-white">Student Personal Management System &copy; 2026</p>
          <p className="text-indigo-300 text-sm mt-0.5">Helping students stay organized</p>
        </div>
        <div className="flex gap-4 text-sm text-indigo-300">
          <a href="/assignments" className="hover:text-white transition-colors">Assignments</a>
          <a href="/attendance" className="hover:text-white transition-colors">Attendance</a>
          <a href="/exams" className="hover:text-white transition-colors">Exams</a>
          <a href="/notes" className="hover:text-white transition-colors">Notes</a>
        </div>
        <p className="text-indigo-400 text-xs">Contact: info@spms.com</p>
      </div>
    </footer>
  );
};

export default Footer;
