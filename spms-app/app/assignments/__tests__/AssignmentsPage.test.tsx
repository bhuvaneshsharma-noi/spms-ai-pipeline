import { render, screen } from '@testing-library/react';
import AssignmentsPage from '../page';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/assignments', (req, res, ctx) => {
    return res(ctx.json([{ id: 1, title: 'Assignment 1' }, { id: 2, title: 'Assignment 2' }]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AssignmentsPage', () => {
  test('renders loading state initially', () => {
    render(<AssignmentsPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders assignments when fetched successfully', async () => {
    render(<AssignmentsPage />);
    expect(await screen.findByText('Assignment 1')).toBeInTheDocument();
    expect(await screen.findByText('Assignment 2')).toBeInTheDocument();
  });

  test('renders error message on fetch failure', async () => {
    server.use(
      rest.get('/api/assignments', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    render(<AssignmentsPage />);
    expect(await screen.findByText('Failed to fetch assignments')).toBeInTheDocument();
  });

  test('renders no assignments found message when empty', async () => {
    server.use(
      rest.get('/api/assignments', (req, res, ctx) => {
        return res(ctx.json([]));
      })
    );
    render(<AssignmentsPage />);
    expect(await screen.findByText('No assignments found.')).toBeInTheDocument();
  });
});