import React, { useState } from 'react';
import Sidebar from './components/Sidebar';

const Layout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex">
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 p-4">
        <button onClick={toggleSidebar} className="md:hidden p-2 bg-blue-500 text-white rounded">
          Toggle Menu
        </button>
        {children}
      </div>
    </div>
  );
};

export default Layout;