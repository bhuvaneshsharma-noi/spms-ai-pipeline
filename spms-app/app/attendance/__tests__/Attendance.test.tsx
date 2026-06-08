import React from 'react';
import { render, screen } from '@testing-library/react';
import Attendance from '../page';

describe('Attendance Component', () => {
  test('renders loading state', () => {
    render(<Attendance />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });
});