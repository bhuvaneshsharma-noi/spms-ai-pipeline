import { render, screen, fireEvent } from '@testing-library/react';
import ThemeSwitcher from '../ThemeSwitcher';

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('changes theme to white', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText(/White/));
    expect(document.documentElement.className).toBe('white');
    expect(localStorage.getItem('theme')).toBe('white');
  });

  test('changes theme to green', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText(/Green/));
    expect(document.documentElement.className).toBe('green');
    expect(localStorage.getItem('theme')).toBe('green');
  });

  test('changes theme to blue', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText(/Blue/));
    expect(document.documentElement.className).toBe('blue');
    expect(localStorage.getItem('theme')).toBe('blue');
  });

  test('changes theme to dark', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByText(/Dark/));
    expect(document.documentElement.className).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});