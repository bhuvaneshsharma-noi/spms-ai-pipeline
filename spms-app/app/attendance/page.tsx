import React, { useEffect, useState } from 'react';

const AttendancePage = () => {
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch('/data/attendance.json');
        if (!response.ok) throw new Error('Failed to fetch attendance');
        const data = await response.json();
        setAttendance(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) return <div className="text-center py-10">Loading attendance...</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
  if (Object.keys(attendance).length === 0) return <div className="text-center py-10">No attendance records found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Attendance Tracker</h1>
      <ul className="space-y-2">
        {Object.entries(attendance).map(([subject, record]) => (
          <li key={subject} className="border p-4 rounded shadow">
            <h2 className="font-semibold">{subject}</h2>
            <p>Present: {record.present}</p>
            <p>Absent: {record.absent}</p>
            <p>Attendance Rate: {((record.present / (record.present + record.absent)) * 100).toFixed(2)}%</p>
            <button className="bg-green-500 text-white px-2 py-1 rounded">Mark Present</button>
            <button className="bg-red-500 text-white px-2 py-1 rounded">Mark Absent</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttendancePage;