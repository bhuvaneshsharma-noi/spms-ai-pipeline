import React from 'react';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen">
      <Sidebar />
      <main className="flex-grow p-4">
        {children}
      </main>
      <Footer />
    </div>
  );
}