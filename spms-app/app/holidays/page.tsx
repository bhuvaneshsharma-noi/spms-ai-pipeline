import React from 'react';

const holidays = [
  { date: '2023-12-25', name: 'Christmas Day' },
  { date: '2024-01-01', name: 'New Year’s Day' },
  { date: '2024-04-01', name: 'Easter Monday' },
  { date: '2024-07-04', name: 'Independence Day' },
];

const HolidaysPage: React.FC = () => {
  return (
    <div className="p-6 bg-indigo-50 min-h-screen">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">School Holidays</h1>
      <ul className="space-y-2">
        {holidays.map((holiday) => (
          <li key={holiday.date} className="p-4 bg-white shadow rounded-md">
            <span className="block text-lg font-semibold text-indigo-900">{holiday.name}</span>
            <span className="block text-sm text-indigo-600">{holiday.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HolidaysPage;