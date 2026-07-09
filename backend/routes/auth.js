import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

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

router.post('/login', async (req, res) => {
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



