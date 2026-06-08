import { render, screen } from '@testing-library/react';
import HomePage from '../page';

describe('HomePage Component', () => {
  test('renders homepage content', () => {
    render(<HomePage />);
    expect(screen.getByText(/Welcome to the Student Personal Management System/i)).toBeInTheDocument();
  });
});