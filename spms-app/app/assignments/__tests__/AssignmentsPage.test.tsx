import { render, screen, waitFor } from '@testing-library/react';
import AssignmentsPage from '../page';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('AssignmentsPage', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('renders loading state', () => {
    render(<AssignmentsPage />);
    expect(screen.getByText(/Loading assignments.../i)).toBeInTheDocument();
  });

  test('renders error message on fetch failure', async () => {
    fetch.mockReject(new Error('Failed to fetch assignments'));
    render(<AssignmentsPage />);
    await waitFor(() => expect(screen.getByText(/Failed to fetch assignments/i)).toBeInTheDocument());
  });

  test('renders no assignments found message', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    render(<AssignmentsPage />);
    await waitFor(() => expect(screen.getByText(/No assignments found./i)).toBeInTheDocument());
  });

  test('renders assignments list', async () => {
    const assignments = [{ id: 1, title: 'Test Assignment', subject: 'Math', dueDate: '2023-10-01', priority: 'High' }];
    fetch.mockResponseOnce(JSON.stringify(assignments));
    render(<AssignmentsPage />);
    await waitFor(() => expect(screen.getByText(/Test Assignment/i)).toBeInTheDocument());
    expect(screen.getByText(/Subject: Math/i)).toBeInTheDocument();
    expect(screen.getByText(/Due Date: 2023-10-01/i)).toBeInTheDocument();
    expect(screen.getByText(/High/i)).toBeInTheDocument();
  });
});