import { render, screen } from '@testing-library/react';
import Page from '../page';

describe('Page Component', () => {
  test('renders loading state', () => {
    render(<Page />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders error state', () => {
    render(<Page error={true} />);
    expect(screen.getByText(/error loading tickets/i)).toBeInTheDocument();
  });

  test('renders tickets', () => {
    const tickets = [{ id: 1, title: 'Test Ticket', description: 'Test Description', assignedUser: 'user1', status: 'open' }];
    render(<Page tickets={tickets} />);
    expect(screen.getByText(/Test Ticket/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Description/i)).toBeInTheDocument();
    expect(screen.getByText(/user1/i)).toBeInTheDocument();
    expect(screen.getByText(/open/i)).toBeInTheDocument();
  });
});