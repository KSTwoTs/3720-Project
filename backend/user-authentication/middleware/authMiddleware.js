// backend/user-authentication/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_EXPIRY_SECONDS = 30 * 60; // 30 minutes

// Issues a JWT for the given user
export function issueToken(user) {
  const payload = {
    sub: user.id,
    email: user.email
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY_SECONDS // 30m
  });

  return token;
}

// Express middleware to protect routes.
// Looks for token in HTTP-only cookie (token) or Authorization: Bearer
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    let token = null;

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res
            .status(401)
            .json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = {
        id: decoded.sub,
        email: decoded.email
      };
      next();
    });
  } catch (e) {
    console.error('Error in requireAuth', e);
    res.status(500).json({ error: 'Auth middleware failed' });
  }
}
