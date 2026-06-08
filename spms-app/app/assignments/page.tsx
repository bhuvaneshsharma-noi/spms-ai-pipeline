import React, { useEffect, useState } from 'react';
import Layout from '../layout';

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch('/data/tickets.json');
        if (!response.ok) {
          throw new Error('Failed to fetch assignments');
        }
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

  if (loading) {
    return <Layout><div className="text-center">Loading...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="text-center text-red-500">Error: {error}</div></Layout>;
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold">Assignments</h1>
      <ul className="mt-4">
        {assignments.map((assignment) => (
          <li key={assignment.id} className="p-2 border-b border-gray-300">
            <h2 className="font-semibold">{assignment.summary}</h2>
            <p>{assignment.description}</p>
          </li>
        ))}
      </ul>
    </Layout>
  );
};

export default AssignmentsPage;