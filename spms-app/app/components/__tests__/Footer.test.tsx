import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders footer content', () => {
    render(<Footer />);
    expect(screen.getByText(/Student Personal Management System/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Links/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact: info@spms.com/i)).toBeInTheDocument();
  });
});