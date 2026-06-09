import { render, screen, fireEvent } from '@testing-library/react';
import ThemeSwitcher from '../ThemeSwitcher';

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders theme buttons', () => {
    render(<ThemeSwitcher />);
    expect(screen.getByText('White')).toBeInTheDocument();
    expect(screen.getByText('Green')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  test('changes theme to white', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText('White'));
    expect(localStorage.getItem('theme')).toBe('white');
  });

  test('changes theme to green', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText('Green'));
    expect(localStorage.getItem('theme')).toBe('green');
  });

  test('changes theme to blue', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText('Blue'));
    expect(localStorage.getItem('theme')).toBe('blue');
  });

  test('changes theme to dark', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText('Dark'));
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  test('loads saved theme from localStorage', () => {
    localStorage.setItem('theme', 'blue');
    render(<ThemeSwitcher />);
    expect(screen.getByText('Blue')).toHaveClass('bg-blue-700 text-white');
  });
});