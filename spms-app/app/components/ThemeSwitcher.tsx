'use client';

import { useState } from 'react';

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState('white');

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className='flex space-x-4 p-4'>
      <button onClick={() => handleThemeChange('white')} className='bg-white text-black p-2'>White</button>
      <button onClick={() => handleThemeChange('green')} className='bg-green-700 text-white p-2'>Green</button>
      <button onClick={() => handleThemeChange('blue')} className='bg-blue-700 text-white p-2'>Blue</button>
      <button onClick={() => handleThemeChange('dark')} className='bg-gray-800 text-white p-2'>Dark</button>
    </div>
  );
};

export default ThemeSwitcher;
