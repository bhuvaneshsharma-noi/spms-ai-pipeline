import React from 'react';

const Footer = () => {
  return (
    <footer className='bg-gray-800 text-white p-4 mt-4'>
      <div className='text-center'>
        <p>Student Personal Management System &copy; {new Date().getFullYear()}</p>
        <p>Quick Links: <a href='/dashboard' className='text-indigo-400'>Dashboard</a>, <a href='/assignments' className='text-indigo-400'>Assignments</a>, <a href='/attendance' className='text-indigo-400'>Attendance</a>, <a href='/exams' className='text-indigo-400'>Exams</a></p>
        <p>Helping students stay organized</p>
        <p>Contact: info@spms.com</p>
      </div>
    </footer>
  );
};

export default Footer;