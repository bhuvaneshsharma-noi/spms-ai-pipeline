import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';

describe('Sidebar Component', () => {
  test('renders sidebar with links', () => {
    render(<Sidebar isOpen={true} toggleSidebar={() => {}} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Assignments')).toBeInTheDocument();
  });

  test('toggles sidebar visibility', () => {
    const toggleSidebar = jest.fn();
    render(<Sidebar isOpen={true} toggleSidebar={toggleSidebar} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(toggleSidebar).toHaveBeenCalledTimes(1);
  });
});