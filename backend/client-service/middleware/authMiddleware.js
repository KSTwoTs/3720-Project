// backend/client-service/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function requireAuth(req, res, next) {
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
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  });
}
