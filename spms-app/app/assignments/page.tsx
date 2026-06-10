'use client';

import { useEffect, useState } from 'react';

export default function AssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);;

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch('/api/assignments');
        const data = await response.json();
        setAssignments(data);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  if (loading) {
    return <div className='p-8 text-gray-500'>Loading...</div>;
  }

  if (assignments.length === 0) {
    return <div className='p-8 text-gray-500'>No assignments found.</div>;
  }

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>Assignments</h1>
      <ul>
        {assignments.map((assignment: { id: string; title: string }) => (
          <li key={assignment.id} className='mb-2'>{assignment.title}</li>
        ))}
      </ul>
    </div>
  );
}