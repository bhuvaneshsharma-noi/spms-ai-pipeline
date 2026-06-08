import { render, screen, fireEvent } from '@testing-library/react';
import TimerPage from '../page';

describe('TimerPage', () => {
  test('renders TimerPage with initial state', () => {
    render(<TimerPage />);
    expect(screen.getByText(/Pomodoro Timer/i)).toBeInTheDocument();
    expect(screen.getByText(/Study Time: 25:00/i)).toBeInTheDocument();
    expect(screen.getByText(/Sessions Completed: 0/i)).toBeInTheDocument();
  });

  test('starts the timer when Start button is clicked', () => {
    jest.useFakeTimers();
    render(<TimerPage />);
    fireEvent.click(screen.getByText(/Start/i));
    jest.advanceTimersByTime(1000);
    expect(screen.getByText(/Study Time: 24:59/i)).toBeInTheDocument();
    jest.advanceTimersByTime(1500 * 1000); // Advance to end of study time
    expect(screen.getByText(/Break Time/i)).toBeInTheDocument();
  });

  test('pauses the timer when Pause button is clicked', () => {
    jest.useFakeTimers();
    render(<TimerPage />);
    fireEvent.click(screen.getByText(/Start/i));
    jest.advanceTimersByTime(1000);
    fireEvent.click(screen.getByText(/Pause/i));
    jest.advanceTimersByTime(1000);
    expect(screen.getByText(/Study Time: 24:59/i)).toBeInTheDocument(); // Should not change
  });

  test('resets the timer when Reset button is clicked', () => {
    jest.useFakeTimers();
    render(<TimerPage />);
    fireEvent.click(screen.getByText(/Start/i));
    jest.advanceTimersByTime(1000);
    fireEvent.click(screen.getByText(/Reset/i));
    expect(screen.getByText(/Study Time: 25:00/i)).toBeInTheDocument();
    expect(screen.getByText(/Sessions Completed: 0/i)).toBeInTheDocument();
  });
});