// backend/user-authentication/routes/authRoutes.js
import { Router } from 'express';
import { register, login, logout, currentUser } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Registration & login
router.post('/register', register);
router.post('/login', login);

// Current user (protected)
router.get('/me', requireAuth, currentUser);

// Logout
router.post('/logout', logout);

export default router;
