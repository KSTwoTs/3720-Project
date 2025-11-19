// backend/user-authentication/controllers/authController.js
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from '../models/userModel.js';
import { issueToken } from '../middleware/authMiddleware.js';

const SALT_ROUNDS = 10;

// POST /register
export async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email and password are required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser(email, passwordHash);

    // For registration, we can auto-login or just confirm; let's auto-login.
    const token = issueToken(user);

    // Set HTTP-only cookie (more secure for real apps)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000 // 30 minutes
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email },
      token
    });
  } catch (err) {
    console.error('Error in register', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
}

// POST /login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = issueToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000
    });

    return res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email },
      token
    });
  } catch (err) {
    console.error('Error in login', err);
    res.status(500).json({ error: 'Failed to login' });
  }
}

// POST /logout
export function logout(req, res) {
  // Clear cookie; client should also clear in-memory state
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}

// GET /me
export function currentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
}
