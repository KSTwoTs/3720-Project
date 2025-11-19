// frontend/src/components/auth/Register.test.jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext.jsx';
import Register from './Register.jsx';

const mockUser = { id: 2, email: 'newuser@example.com' };

function WrapperWithUserDisplay({ children }) {
  const { user } = useAuth();
  return (
    <>
      {children}
      <div data-testid="user-email">{user ? user.email : 'none'}</div>
    </>
  );
}

describe('Register component', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
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

  it('registers and updates AuthContext on success', async () => {
    render(
      <AuthProvider>
        <WrapperWithUserDisplay>
          <Register />
        </WrapperWithUserDisplay>
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe(
        'newuser@example.com'
      );
    });
  });
});
