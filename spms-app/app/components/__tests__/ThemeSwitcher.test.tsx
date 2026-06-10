import { render, screen, fireEvent } from '@testing-library/react';
import ThemeSwitcher from '../ThemeSwitcher';

describe('ThemeSwitcher', () => {
  test('renders theme buttons', () => {
    render(<ThemeSwitcher />);
    expect(screen.getByText('White')).toBeInTheDocument();
    expect(screen.getByText('Green')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  test('changes theme to green', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText('Green'));
    expect(localStorage.getItem('theme')).toBe('green');
    expect(document.documentElement.className).toBe('green');
  });

  test('changes theme to blue', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText('Blue'));
    expect(localStorage.getItem('theme')).toBe('blue');
    expect(document.documentElement.className).toBe('blue');
  });

  test('changes theme to dark', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText('Dark'));
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.className).toBe('dark');
  });
});