import { render, screen, waitFor } from '@testing-library/react';
import AssignmentsPage from '../page';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '',
  }),
}));

describe('AssignmentsPage', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('renders loading state initially', () => {
    render(<AssignmentsPage />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('renders assignments when fetched successfully', async () => {
    fetch.mockResponseOnce(JSON.stringify([{ id: 1, title: 'Test Assignment', subject: 'Math', dueDate: '2023-10-10', priority: 'high' }]));
    render(<AssignmentsPage />);
    await waitFor(() => expect(screen.getByText(/Test Assignment/i)).toBeInTheDocument());
    expect(screen.getByText(/No assignments found./i)).not.toBeInTheDocument();
  });

  it('renders error message when fetch fails', async () => {
    fetch.mockRejectOnce(new Error('Failed to fetch assignments'));
    render(<AssignmentsPage />);
    await waitFor(() => expect(screen.getByText(/Failed to fetch assignments/i)).toBeInTheDocument());
  });
});