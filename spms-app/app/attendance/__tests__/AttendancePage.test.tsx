import { render, screen, waitFor } from '@testing-library/react';
import AttendancePage from '../page';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('AttendancePage', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('renders loading state', () => {
    render(<AttendancePage />);
    expect(screen.getByText(/Loading attendance.../i)).toBeInTheDocument();
  });

  test('renders error message on fetch failure', async () => {
    fetch.mockReject(new Error('Failed to fetch attendance'));
    render(<AttendancePage />);
    await waitFor(() => expect(screen.getByText(/Failed to fetch attendance/i)).toBeInTheDocument());
  });

  test('renders no attendance records found message', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    render(<AttendancePage />);
    await waitFor(() => expect(screen.getByText(/No attendance records found./i)).toBeInTheDocument());
  });

  test('renders attendance records', async () => {
    const attendance = { Math: { present: 10, absent: 2 } };
    fetch.mockResponseOnce(JSON.stringify(attendance));
    render(<AttendancePage />);
    await waitFor(() => expect(screen.getByText(/Math/i)).toBeInTheDocument());
    expect(screen.getByText(/Present: 10/i)).toBeInTheDocument();
    expect(screen.getByText(/Absent: 2/i)).toBeInTheDocument();
  });
});