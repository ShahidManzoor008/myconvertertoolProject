import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import AdminLayout from '../../components/layouts/AdminLayout';
import Dashboard from './Dashboard';
import Users from './Users';
import Settings from './Settings';
import BlogManagement from './BlogManagement';
import { adminApi, blogApi, apiClient } from '../../utils/apiClient';

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { name: 'Admin' }, logout }) }));
vi.mock('../../utils/apiClient', () => ({ adminApi: { getStats: vi.fn(), getUsers: vi.fn(), updateUser: vi.fn(), deleteUser: vi.fn() }, blogApi: { getPosts: vi.fn() }, apiClient: { delete: vi.fn() } }));
const renderPage = page => render(<MemoryRouter>{page}</MemoryRouter>);
const account = id => ({ _id: String(id), name: `User ${id}`, email: `user${id}@example.com`, role: 'user', status: 'active' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}]);
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('admin drawer locks scrolling, traps keyboard focus and restores focus on Escape', async () => {
  render(<MemoryRouter initialEntries={['/admin/dashboard']}><Routes><Route path="/admin" element={<AdminLayout />}><Route path="dashboard" element={<h1>Dashboard</h1>} /></Route></Routes></MemoryRouter>);
  const trigger = screen.getByRole('button', { name: 'Open admin navigation' });
  const sidebar = document.getElementById('admin-navigation');
  expect(sidebar).toHaveAttribute('inert');
  fireEvent.click(trigger);
  expect(sidebar).not.toHaveAttribute('inert');
  expect(sidebar).toHaveAttribute('aria-modal', 'true');
  expect(document.body.style.overflow).toBe('hidden');
  const signout = screen.getByRole('button', { name: 'Logout' });
  signout.focus(); fireEvent.keyDown(signout, { key: 'Tab' });
  expect(screen.getByRole('link', { name: 'Admin Panel' })).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(document.body.style.overflow).toBe('');
});

test('admin sidebar Logout invokes the session logout', () => {
  renderPage(<AdminLayout />);
  fireEvent.click(screen.getByRole('button', { name: 'Open admin navigation' }));
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
  expect(logout).toHaveBeenCalledTimes(1);
});

test('dashboard exposes API errors and allows recovery without claiming system health', async () => {
  adminApi.getStats.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValue({ users: 12, activeUsers: 6, posts: 3, conversions: 432 });
  renderPage(<Dashboard />);
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  expect(screen.queryByText('Operational')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('432')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('Users reaches accounts beyond the first page and identifies local search scope', async () => {
  adminApi.getUsers.mockImplementation(async page => ({ users: [account(page === 1 ? 1 : 21)], total: 21 }));
  renderPage(<Users />);
  await screen.findByText('User 1');
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search this page' }), { target: { value: 'missing' } });
  expect(screen.getByText('No accounts match this search on the current page.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByText('User 21');
  expect(adminApi.getUsers).toHaveBeenLastCalledWith(2, 20);
  expect(screen.getByRole('searchbox')).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
});

test('account status changes show feedback and disable repeated actions while pending', async () => {
  adminApi.getUsers.mockResolvedValue({ users: [account(1)], total: 1 });
  let finish;
  adminApi.updateUser.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  renderPage(<Users />);
  const toggle = await screen.findByRole('button', { name: 'Deactivate User 1' });
  fireEvent.click(toggle);
  expect(toggle).toBeDisabled();
  finish({});
  await screen.findByRole('button', { name: 'Activate User 1' });
  expect(screen.getByText('Account deactivated.')).toBeInTheDocument();
});

test('Settings explains unavailable configuration instead of offering a simulated save', () => {
  renderPage(<Settings />);
  expect(screen.getByText(/not available yet/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Save/ })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open maintenance tools' })).toHaveAttribute('href', '/admin/analytics#maintenance');
});


test('blog selection clears on search and select-all only includes matching posts', async () => {
  const posts = [{ _id: 'one', slug: 'one', title: 'First post', excerpt: '', author: 'Admin' }, { _id: 'two', slug: 'two', title: 'Second post', excerpt: '', author: 'Admin' }];
  blogApi.getPosts.mockResolvedValue({ posts, hasNextPage: false });
  apiClient.delete.mockResolvedValue({});
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  renderPage(<BlogManagement />);
  await waitFor(() => expect(within(screen.getByRole('table')).getByText('First post')).toBeInTheDocument());
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select all matching posts' }));
  expect(screen.getByRole('button', { name: 'Delete Selected' })).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search posts' }), { target: { value: 'Second' } });
  expect(screen.queryByRole('button', { name: 'Delete Selected' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select all matching posts' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete Selected' }));
  await waitFor(() => expect(apiClient.delete).toHaveBeenCalledTimes(1));
  expect(apiClient.delete).toHaveBeenCalledWith('/api/blog/posts/two');
});


test('mobile drafts expose a direct review and publish action', async () => {
  blogApi.getPosts.mockResolvedValue({ posts: [{ _id: 'ai', slug: 'ai-test-draft', title: 'AI test draft', excerpt: 'Review this draft.', author: 'Team', status: 'draft', createdAt: new Date().toISOString() }], hasNextPage: false });
  renderPage(<BlogManagement />);
  const cards = screen.getByLabelText('Articles');
  const action = await within(cards).findByRole('link', { name: 'Review & publish' });
  expect(action).toHaveAttribute('href', '/admin/posts/ai-test-draft/edit');
  expect(within(cards).getByRole('link', { name: 'AI test draft' })).toHaveAttribute('href', action.getAttribute('href'));
});
