import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch('/data/assignments.json');
        if (!response.ok) throw new Error('Failed to fetch assignments');
        const data = await response.json();
        setAssignments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  if (loading) return <div className="text-center py-10">Loading assignments...</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
  if (assignments.length === 0) return <div className="text-center py-10">No assignments found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Assignments</h1>
      <Link href="/assignments/new" className="bg-blue-500 text-white px-4 py-2 rounded mb-4 inline-block">Create New Assignment</Link>
      <ul className="space-y-2">
        {assignments.map((assignment) => (
          <li key={assignment.id} className="border p-4 rounded shadow">
            <h2 className="font-semibold">{assignment.title}</h2>
            <p>Subject: {assignment.subject}</p>
            <p>Due Date: {assignment.dueDate}</p>
            <span className={`badge ${assignment.priority.toLowerCase()}`}>{assignment.priority}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AssignmentsPage;