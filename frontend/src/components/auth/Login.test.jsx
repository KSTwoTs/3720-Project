// frontend/src/components/auth/Login.test.jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext.jsx';
import Login from './Login.jsx';

const mockUser = { id: 1, email: 'user@example.com' };

function WrapperWithUserDisplay({ children }) {
  const { user } = useAuth();
  return (
    <>
      {children}
      <div data-testid="user-email">{user ? user.email : 'none'}</div>
    </>
  );
}

describe('Login component', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          user: mockUser,
          token: 'fake-token',
        }),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('logs in and updates AuthContext on success', async () => {
    render(
      <AuthProvider>
        <WrapperWithUserDisplay>
          <Login />
        </WrapperWithUserDisplay>
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // AuthContext should now contain the logged-in user
    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe(
        'user@example.com'
      );
    });
  });
});
