import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer Component', () => {
  test('renders footer content', () => {
    render(<Footer />);
    expect(screen.getByText(/Student Personal Management System/i)).toBeInTheDocument();
    expect(screen.getByText(/Helping students stay organized/i)).toBeInTheDocument();
  });
});