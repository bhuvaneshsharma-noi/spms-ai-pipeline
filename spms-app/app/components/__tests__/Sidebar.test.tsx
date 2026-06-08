import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';

describe('Sidebar Component', () => {
  test('renders sidebar with links', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Assignments')).toBeInTheDocument();
    expect(screen.getByText('Exams')).toBeInTheDocument();
  });

  test('toggles sidebar visibility', () => {
    render(<Sidebar />);
    const toggleButton = screen.getByRole('button');
    toggleButton.click();
    expect(screen.getByText('SPMS')).toBeVisible();
  });
});