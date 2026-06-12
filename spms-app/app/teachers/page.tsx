"use client";

import { useState } from "react";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<string[]>(["Mr. Smith", "Ms. Johnson", "Mrs. Brown"]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teachers</h1>
      <ul className="list-disc pl-5">
        {teachers.map((teacher, index) => (
          <li key={index} className="mb-2">{teacher}</li>
        ))}
      </ul>
    </div>
  );
}
