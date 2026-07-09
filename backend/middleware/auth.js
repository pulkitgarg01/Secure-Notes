import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, email, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}



