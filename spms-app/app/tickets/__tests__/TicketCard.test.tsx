import { render, screen } from '@testing-library/react';
import TicketCard from '../TicketCard';

describe('TicketCard Component', () => {
  const ticket = { title: 'Test Ticket', description: 'Test Description', assignedUser: 'user1', status: 'open' };

  test('renders ticket details', () => {
    render(<TicketCard ticket={ticket} />);
    expect(screen.getByText(/Test Ticket/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Description/i)).toBeInTheDocument();
    expect(screen.getByText(/user1/i)).toBeInTheDocument();
    expect(screen.getByText(/open/i)).toBeInTheDocument();
  });
});