// frontend/src/context/AuthContext.test.jsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react'; // ⬅️ waitFor added
import { AuthProvider, useAuth } from './AuthContext.jsx';

function TestConsumer() {
  const { user, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="user-email">{user ? user.email : 'none'}</div>
      <button
        type="button"
        onClick={() =>
          login({ id: 1, email: 'user@example.com' }, 'fake-token')
        }
      >
        do-login
      </button>
      <button type="button" onClick={logout}>
        do-logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  it('defaults to no user and can login/logout', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // initially no user
    expect(screen.getByTestId('user-email').textContent).toBe('none');

    // login
    screen.getByText('do-login').click();

    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe(
        'user@example.com'
      );
    });

    // logout
    screen.getByText('do-logout').click();

    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe('none');
    });
  });
});
