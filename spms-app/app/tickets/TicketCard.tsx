"use client";

import React from 'react';

const TicketCard = ({ ticket }) => {
  return (
    <div className='bg-white shadow-md rounded-lg p-4'>
      <h2 className='text-xl font-semibold'>{ticket.title}</h2>
      <p className='text-gray-700'>{ticket.description}</p>
      <p className='text-sm text-gray-500'>Assigned to: {ticket.assignedTo}</p>
      <p className='text-sm text-gray-500'>Status: {ticket.status}</p>
    </div>
  );
};

export default TicketCard;