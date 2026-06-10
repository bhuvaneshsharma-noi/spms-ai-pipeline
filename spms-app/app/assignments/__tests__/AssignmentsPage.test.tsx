import { render, screen } from '@testing-library/react';
import AssignmentsPage from '../page';

jest.mock('next/router', () => ({
  useRouter: () => ({ query: {} }),
}));

describe('AssignmentsPage', () => {
  test('renders loading state', () => {
    render(<AssignmentsPage />);
    const loadingElement = screen.getByText(/Loading.../i);
    expect(loadingElement).toBeInTheDocument();
  });

  test('renders no assignments found state', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve([]),
    }));
    render(<AssignmentsPage />);
    const noAssignmentsElement = await screen.findByText(/No assignments found./i);
    expect(noAssignmentsElement).toBeInTheDocument();
  });
});