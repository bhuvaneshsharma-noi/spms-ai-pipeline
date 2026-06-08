import { render, screen } from '@testing-library/react';
import AssignmentsPage from '../page';

describe('AssignmentsPage Component', () => {
  test('renders loading state', () => {
    render(<AssignmentsPage />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  test('renders error state', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Failed to fetch assignments')));
    render(<AssignmentsPage />);
    expect(await screen.findByText(/Error: Failed to fetch assignments/i)).toBeInTheDocument();
  });
});