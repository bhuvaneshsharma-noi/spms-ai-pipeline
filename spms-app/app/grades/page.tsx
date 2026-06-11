export default function GradesPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Grades</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Subject</th>
            <th className="py-2">Score</th>
            <th className="py-2">Grade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">Math</td>
            <td className="border px-4 py-2">85</td>
            <td className="border px-4 py-2">A</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Science</td>
            <td className="border px-4 py-2">72</td>
            <td className="border px-4 py-2">B</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">English</td>
            <td className="border px-4 py-2">90</td>
            <td className="border px-4 py-2">A+</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
