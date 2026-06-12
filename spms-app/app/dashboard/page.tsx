import React from 'react';
import Image from 'next/image';

const Dashboard = () => {
  const student = {
    name: 'Bhuvanesh',
    course: 'B.Tech Computer Science',
    semester: '6th',
    rollNumber: 'CS2021045',
    avatar: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=BH', // Placeholder for avatar
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center">
          <Image src={student.avatar} alt="Student Avatar" width={50} height={50} className="rounded-full mr-4" />
          <div>
            <h2 className="text-xl font-bold">Welcome Back Student</h2>
            <p>{student.course} - {student.semester}</p>
            <p>Roll No: {student.rollNumber}</p>
          </div>
        </div>
      </div>
      {/* Student List Placeholder */}
      <div className="mt-4 w-full max-w-md">
        <h3 className="text-lg font-semibold">Student List</h3>
        {/* Student list will be rendered here */}
      </div>
    </div>
  );
};

export default Dashboard;
