'use client';

import { useEffect, useState } from 'react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch('/api/assignments');
        if (!response.ok) throw new Error('Failed to fetch assignments');
        const data = await response.json();
        setAssignments(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  if (loading) return <div className='p-8'>Loading...</div>;
  if (error) return <div className='p-8 text-red-500'>{error}</div>;
  if (assignments.length === 0) return <div className='p-8 text-gray-500'>No assignments found.</div>;

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>Assignments</h1>
      <ul>
        {assignments.map((assignment) => (
          <li key={assignment.id} className='border-b py-2'>{assignment.title}</li>
        ))}
      </ul>
    </div>
  );
}