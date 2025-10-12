export default function apiKeyAuth(req, res, next) {
  const incomingKey = req.header('x-api-key');
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    console.error('ADMIN_API_KEY not set in .env');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  if (!incomingKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  if (incomingKey !== expectedKey) {
    console.warn('Invalid API key received:', incomingKey);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
