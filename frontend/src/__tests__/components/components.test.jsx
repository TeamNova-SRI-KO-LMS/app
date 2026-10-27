import { describe, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import useAuth from '../../context/useAuth';
import { useAuth as useAuthFromContext } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import UserAvatar from '../../components/UserAvatar';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScrollToTop from '../../components/ScrollToTop';

const renderGuarded = (auth, { roles, path = '/dashboard' } = {}) => render(
  <AuthContext.Provider value={auth}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={<ProtectedRoute roles={roles}><p>Secret page</p></ProtectedRoute>} />
        <Route path="/login" element={<p>User sign-in</p>} />
        <Route path="/admin/login" element={<p>Admin sign-in</p>} />
        <Route path="/" element={<p>Home</p>} />
      </Routes>
    </MemoryRouter>
  </AuthContext.Provider>,
);

describe('ProtectedRoute', () => {
  test('TC-FE-CMP-01 shows a spinner while the session is being restored [FR-002]', () => {
    const { container } = renderGuarded({ loading: true, isAuthenticated: false });

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
  });

  test('TC-FE-CMP-02 sends visitors to the user sign-in page [FR-002]', () => {
    renderGuarded({ loading: false, isAuthenticated: false });

    expect(screen.getByText('User sign-in')).toBeInTheDocument();
  });

  test('TC-FE-CMP-03 sends visitors of admin pages to the admin sign-in page [FR-009]', () => {
    renderGuarded({ loading: false, isAuthenticated: false }, { roles: ['admin'], path: '/admin' });

    expect(screen.getByText('Admin sign-in')).toBeInTheDocument();
  });

  test('TC-FE-CMP-04 refuses a signed-in user without the required role [FR-009]', () => {
    renderGuarded({ loading: false, isAuthenticated: true, user: { role: 'student' } }, { roles: ['admin'], path: '/admin' });
    expect(screen.getByText('Admin sign-in')).toBeInTheDocument();
  });

  test('TC-FE-CMP-05 redirects a non-admin role restriction to the home page [FR-009]', () => {
    renderGuarded({ loading: false, isAuthenticated: true, user: { role: 'student' } }, { roles: ['instructor'] });

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  test('TC-FE-CMP-06 renders the page for an authorized user [FR-002]', () => {
    renderGuarded({ loading: false, isAuthenticated: true, user: { role: 'admin' } }, { roles: ['admin'], path: '/admin' });

    expect(screen.getByText('Secret page')).toBeInTheDocument();
  });
});

describe('useAuth', () => {
  test('TC-FE-CMP-07 throws a clear error outside the AuthProvider [NFR-006]', () => {
    const Probe = ({ hook }) => {
      hook();
      return null;
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Probe hook={useAuth} />)).toThrow('useAuth must be used within an AuthProvider');
    expect(() => render(<Probe hook={useAuthFromContext} />)).toThrow('useAuth must be used within an AuthProvider');
  });
});

describe('Shared components', () => {
  test('TC-FE-CMP-08 UserAvatar shows the photo and falls back to initials or an icon when it is missing or broken [FR-012]', () => {
    const { rerender, container } = render(<UserAvatar user={{ name: 'Nimali', avatar: 'https://img/a.png' }} />);
    fireEvent.error(screen.getByAltText('Nimali'));

    expect(screen.queryByAltText('Nimali')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
    rerender(<UserAvatar user={{ name: 'Nimali' }} src="https://img/preview.png" alt="Preview" />);
    expect(screen.getByAltText('Preview')).toHaveAttribute('src', 'https://img/preview.png');
    rerender(<UserAvatar user={{ name: 'Kasun', avatar: '/uploads/avatars/kasun.png' }} />);
    expect(screen.getByAltText('Kasun')).toHaveAttribute('src', 'http://localhost:5000/uploads/avatars/kasun.png');
    rerender(<UserAvatar user={{ name: 'Nimali Perera' }} showInitials />);
    expect(screen.getByText('NP')).toBeInTheDocument();
    rerender(<UserAvatar user={null} size="w-6 h-6" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('w-6', 'h-6');
  });

  test('TC-FE-CMP-09 ConfirmDialog confirms, cancels and closes on backdrop click only [NFR-003]', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog message="Delete this course?" confirmLabel="Delete" onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByRole('dialog'));
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByLabelText('Close'));
    fireEvent.click(screen.getByRole('presentation'));

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  test('TC-FE-CMP-10 ConfirmDialog uses a neutral style for non-destructive actions [NFR-003]', () => {
    render(<ConfirmDialog title="Publish" message="Publish now?" destructive={false} onConfirm={() => {}} onCancel={() => {}} />);

    expect(screen.getByText('Confirm')).toHaveClass('bg-blue-600');
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });

  test('TC-FE-CMP-11 LoadingSpinner maps sizes to classes [NFR-003]', () => {
    const { container } = render(<LoadingSpinner size="xl" className="mx-auto" />);

    expect(container.firstChild).toHaveClass('loading-spinner', 'h-12', 'w-12', 'mx-auto');
  });

  test('TC-FE-CMP-12 ScrollToTop scrolls to the top whenever the route changes [NFR-003]', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    let navigate;
    const Capture = () => {
      navigate = useNavigate();
      return null;
    };
    render(
      <MemoryRouter initialEntries={['/a']}>
        <ScrollToTop />
        <Capture />
      </MemoryRouter>,
    );

    expect(scrollTo).toHaveBeenCalledTimes(1);
    act(() => navigate('/b'));

    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'smooth' });
  });
});
