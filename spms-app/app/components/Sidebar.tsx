import React from 'react';
import Link from 'next/link';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`bg-gray-800 text-white h-full sticky top-0 transition-transform duration-300 ${isOpen ? 'w-64' : 'w-16'} overflow-hidden`}> 
      <div className="flex items-center justify-between p-4">
        <h1 className={`text-lg font-bold transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>SPMS</h1>
        <button onClick={toggleSidebar} className="text-white">
          {isOpen ? '>' : '<'}
        </button>
      </div>
      <nav className="mt-4">
        <ul>
          <li className="p-2 hover:bg-gray-700">
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li className="p-2 hover:bg-gray-700">
            <Link href="/assignments">Assignments</Link>
          </li>
          <li className="p-2 hover:bg-gray-700">
            <Link href="/exams">Exams</Link>
          </li>
          <li className="p-2 hover:bg-gray-700">
            <Link href="/attendance">Attendance</Link>
          </li>
          <li className="p-2 hover:bg-gray-700">
            <Link href="/timetable">Timetable</Link>
          </li>
          <li className="p-2 hover:bg-gray-700">
            <Link href="/notes">Notes</Link>
          </li>
          <li className="p-2 hover:bg-gray-700">
            <Link href="/study-timer">Study Timer</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;