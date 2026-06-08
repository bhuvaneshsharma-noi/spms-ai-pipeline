import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../page';

describe('Dashboard Component', () => {
  test('renders student profile card with correct information', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Bhuvanesh/i)).toBeInTheDocument();
    expect(screen.getByText(/B.Tech Computer Science - 6th/i)).toBeInTheDocument();
    expect(screen.getByText(/Roll No: CS2021045/i)).toBeInTheDocument();
  });
});