import React from 'react';
import { render, screen } from '@testing-library/react';
import Assignments from '../page';

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
  }),
}));

describe('Assignments Component', () => {
  test('renders loading state', () => {
    render(<Assignments />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });
});