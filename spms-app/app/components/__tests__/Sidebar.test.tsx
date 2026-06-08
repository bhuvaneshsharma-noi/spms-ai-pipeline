import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';

describe('Sidebar', () => {
  it('renders sidebar links', () => {
    render(<Sidebar />);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Assignments/i)).toBeInTheDocument();
  });
});