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

  if (loading) return <div className='text-center'>Loading...</div>;
  if (error) return <div className='text-red-500'>{error}</div>;

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Assignments</h1>
      <Link href='/assignments/new' className='bg-indigo-600 text-white px-4 py-2 rounded'>Add New Assignment</Link>
      <ul className='mt-4'>
        {assignments.length === 0 ? (
          <li>No assignments found.</li>
        ) : (
          assignments.map((assignment) => (
            <li key={assignment.id} className='border-b py-2'>
              <span className='font-semibold'>{assignment.title}</span> - {assignment.subject} - Due: {assignment.dueDate} - <span className={`badge ${assignment.priority}`}>{assignment.priority}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default AssignmentsPage;