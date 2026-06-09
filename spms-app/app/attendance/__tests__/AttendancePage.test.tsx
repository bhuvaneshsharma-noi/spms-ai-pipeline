import { render, screen, fireEvent } from '@testing-library/react';
import AttendancePage from '../page';

jest.mock('localStorage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('AttendancePage', () => {
  beforeEach(() => {
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();
  });

  test('renders loading state', () => {
    render(<AttendancePage />);
    expect(screen.getByText(/Loading.../)).toBeInTheDocument();
  });

  test('toggles attendance', () => {
    localStorage.getItem.mockReturnValueOnce(JSON.stringify({}));
    render(<AttendancePage />);

    fireEvent.click(screen.getByText(/Absent/));
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'attendance',
      JSON.stringify({ Math: true })
    );
  });
});