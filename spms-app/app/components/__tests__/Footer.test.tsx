import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer Component', () => {
  test('renders footer content', () => {
    render(<Footer />);
    const footerElement = screen.getByText(/Footer Content/i);
    expect(footerElement).toBeInTheDocument();
  });
});