"use client";

import React from 'react';

const HelloWorldPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">Hello World</h1>
      <p className="mt-4 text-lg text-gray-700">
        This page was created by the AI pipeline.
      </p>
    </div>
  );
};

export default HelloWorldPage;
