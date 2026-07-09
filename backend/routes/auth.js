import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';

const router = express.Router();

// Strict per-IP rate limiter for login — 5 attempts per 15 minutes.
// Layered on top of the global 100 req/15 min limiter on /api/*.
// Returns standard RateLimit-* headers (RFC 6585) and a clear error body.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts from this IP. Please try again in 15 minutes.' },
  standardHeaders: true,  // Return RateLimit-* headers
  legacyHeaders: false,   // Suppress X-RateLimit-* headers
  skipSuccessfulRequests: false, // Count all attempts (not just failures)
});

// Bootstrap first admin
router.post('/bootstrap-admin', async (req, res) => {
  try {
    const expectedToken = process.env.BOOTSTRAP_TOKEN;
    if (!expectedToken) {
      return res.status(503).json({ error: 'Bootstrap is not configured' });
    }
    const providedToken = req.headers['x-bootstrap-token'];
    if (!providedToken || providedToken !== expectedToken) {
      return res.status(403).json({ error: 'Invalid bootstrap token' });
    }

    const count = await User.countDocuments();
    if (count > 0) return res.status(403).json({ error: 'Already initialized' });
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: email.toLowerCase(), password: hash, role: 'admin', name });
    return res.json({ id: user._id });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password || '', user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, user: { id: user._id, role: user.role, email: user.email, name: user.name } });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;



