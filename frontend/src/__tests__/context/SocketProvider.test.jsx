import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, render } from '@testing-library/react';

const socket = { on: vi.fn(), emit: vi.fn(), disconnect: vi.fn(), id: 'sock-1' };
vi.mock('socket.io-client', () => ({ io: vi.fn(() => socket) }));

const loadProvider = async (env = 'true') => {
  vi.resetModules();
  vi.stubEnv('VITE_ENABLE_SOCKET', env);
  const module = await import('../../context/SocketProvider');
  const { io } = await import('socket.io-client');
  // Imported after resetModules so the test and the provider share one context.
  AuthContext = (await import('../../context/AuthContext')).default;
  return { ...module, io };
};

let AuthContext;

const renderWithAuth = (Provider, Consumer, auth) => render(
  <AuthContext.Provider value={auth}>
    <Provider>
      <Consumer />
    </Provider>
  </AuthContext.Provider>,
);

afterEach(() => {
  socket.on.mockReset();
  socket.emit.mockReset();
  socket.disconnect.mockReset();
});

describe('SocketProvider', () => {
  test('TC-FE-SOCK-01 never connects when sockets are disabled for serverless hosting [FR-017]', async () => {
    const { SocketProvider, io, useSocket } = await loadProvider('false');
    localStorage.setItem('token', 't');
    let value;
    const Consumer = () => {
      value = useSocket();
      return null;
    };

    renderWithAuth(SocketProvider, Consumer, { isAuthenticated: true, user: { _id: 'u1' } });

    expect(io).not.toHaveBeenCalled();
    expect(value.isConnected).toBe(false);
  });

  test('TC-FE-SOCK-02 connects with the JWT, tracks the connection and joins course rooms [FR-017]', async () => {
    const { SocketProvider, io, useSocket } = await loadProvider('true');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('token', 'jwt-token');
    let value;
    const Consumer = () => {
      value = useSocket();
      return null;
    };

    const { unmount } = renderWithAuth(SocketProvider, Consumer, { isAuthenticated: true, user: { _id: 'u1' } });
    const handlers = Object.fromEntries(socket.on.mock.calls);
    act(() => handlers.connect());
    value.joinCourse('c1');
    value.leaveCourse('c1');
    act(() => handlers.connect_error(new Error('refused')));
    act(() => handlers.disconnect('transport close'));
    unmount();

    expect(io).toHaveBeenCalledWith('http://localhost:5000', expect.objectContaining({ auth: { token: 'jwt-token' }, reconnectionAttempts: 10 }));
    expect(socket.emit).toHaveBeenCalledWith('join-course', 'c1');
    expect(socket.emit).toHaveBeenCalledWith('leave-course', 'c1');
    expect(socket.disconnect).toHaveBeenCalled();
  });

  test('TC-FE-SOCK-03 does not connect a signed-out visitor and offers safe defaults outside the provider [FR-017]', async () => {
    const { SocketProvider, io, useSocket } = await loadProvider('true');
    let inside;
    let outside;
    const Inside = () => {
      inside = useSocket();
      return null;
    };
    const Outside = () => {
      outside = useSocket();
      return null;
    };

    renderWithAuth(SocketProvider, Inside, { isAuthenticated: false, user: null });
    render(<Outside />);
    inside.joinCourse('c1');
    outside.joinCourse('c1');
    outside.leaveCourse('c1');

    expect(io).not.toHaveBeenCalled();
    expect(outside.socket).toBeNull();
    expect(socket.emit).not.toHaveBeenCalled();
  });
});
