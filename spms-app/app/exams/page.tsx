"use client";

import { useState, useEffect } from "react";

interface Exam {
  id: number;
  subject: string;
  date: string;
  time: string;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      setExams([
        { id: 1, subject: "Mathematics", date: "2023-12-01", time: "10:00 AM" },
        { id: 2, subject: "Science", date: "2023-12-02", time: "1:00 PM" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading exams...</div>;
  }

  if (exams.length === 0) {
    return <div className="p-8 text-gray-500">No upcoming exams.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Upcoming Exams</h1>
      <ul className="space-y-4">
        {exams.map((exam) => (
          <li key={exam.id} className="p-4 bg-white shadow rounded-lg">
            <h2 className="text-xl font-semibold">{exam.subject}</h2>
            <p className="text-gray-700">Date: {exam.date}</p>
            <p className="text-gray-700">Time: {exam.time}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
