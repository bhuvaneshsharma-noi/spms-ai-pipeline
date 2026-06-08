import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white text-center p-4">
      <p>Student Personal Management System &copy; {new Date().getFullYear()}</p>
      <div className="flex justify-center space-x-4">
        <a href="/dashboard" className="hover:underline">Dashboard</a>
        <a href="/assignments" className="hover:underline">Assignments</a>
        <a href="/attendance" className="hover:underline">Attendance</a>
        <a href="/exams" className="hover:underline">Exams</a>
      </div>
      <p className="mt-2">Helping students stay organized</p>
    </footer>
  );
};

export default Footer;