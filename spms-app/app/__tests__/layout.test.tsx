import { render, screen } from '@testing-library/react';
import Layout from '../layout';

describe('Layout Component', () => {
  test('renders children correctly', () => {
    render(<Layout><div>Test Child</div></Layout>);
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });
});