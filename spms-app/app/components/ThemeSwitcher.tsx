'use client';

import React, { useState, useEffect } from 'react';

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState('white');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="flex space-x-4 p-4">
      <button
        className={`p-2 rounded ${theme === 'white' ? 'bg-indigo-500 text-white' : 'bg-gray-300'}`}
        onClick={() => handleThemeChange('white')}
      >
        White
      </button>
      <button
        className={`p-2 rounded ${theme === 'green' ? 'bg-green-700 text-white' : 'bg-gray-300'}`}
        onClick={() => handleThemeChange('green')}
      >
        Green
      </button>
      <button
        className={`p-2 rounded ${theme === 'blue' ? 'bg-blue-700 text-white' : 'bg-gray-300'}`}
        onClick={() => handleThemeChange('blue')}
      >
        Blue
      </button>
      <button
        className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-300'}`}
        onClick={() => handleThemeChange('dark')}
      >
        Dark
      </button>
    </div>
  );
};

export default ThemeSwitcher;