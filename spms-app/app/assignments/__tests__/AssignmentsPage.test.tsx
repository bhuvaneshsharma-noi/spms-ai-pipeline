import { render, screen, fireEvent } from '@testing-library/react';
import AssignmentsPage from '../page';

jest.mock('localStorage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('AssignmentsPage', () => {
  beforeEach(() => {
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();
  });

  test('renders loading state', () => {
    render(<AssignmentsPage />);
    expect(screen.getByText(/Loading.../)).toBeInTheDocument();
  });

  test('renders no assignments found', () => {
    localStorage.getItem.mockReturnValueOnce(JSON.stringify([]));
    render(<AssignmentsPage />);
    expect(screen.getByText(/No assignments found./)).toBeInTheDocument();
  });

  test('adds a new assignment', () => {
    localStorage.getItem.mockReturnValueOnce(JSON.stringify([]));
    render(<AssignmentsPage />);
    fireEvent.change(screen.getByPlaceholderText(/Title/), { target: { value: 'New Assignment' } });
    fireEvent.change(screen.getByPlaceholderText(/Subject/), { target: { value: 'Math' } });
    fireEvent.change(screen.getByPlaceholderText(/Due Date/), { target: { value: '2023-12-31' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'High' } });
    fireEvent.click(screen.getByText(/Add Assignment/));

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'assignments',
      JSON.stringify([{ title: 'New Assignment', subject: 'Math', dueDate: '2023-12-31', priority: 'High', completed: false }])
    );
  });

  test('toggles assignment completion', () => {
    const assignments = [{ title: 'Existing Assignment', subject: 'Science', dueDate: '2023-12-31', priority: 'Medium', completed: false }];
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(assignments));
    render(<AssignmentsPage />);

    fireEvent.click(screen.getByRole('checkbox'));
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'assignments',
      JSON.stringify([{ ...assignments[0], completed: true }])
    );
  });
});