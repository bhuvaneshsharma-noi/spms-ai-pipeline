import { render, screen, fireEvent } from '@testing-library/react';
import Layout from '../layout';

describe('Layout Component', () => {
  test('renders children correctly', () => {
    render(<Layout><div>Test Child</div></Layout>);
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  test('toggles sidebar on button click', () => {
    render(<Layout><div>Test Child</div></Layout>);
    const button = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(button);
    expect(screen.getByText('SPMS')).toBeVisible();
    fireEvent.click(button);
    expect(screen.getByText('SPMS')).not.toBeVisible();
  });
});