import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/secure-notes');
  console.log('Connected to DB');

  const password = await bcrypt.hash('admin123', 10);

  const users = [
    { name: 'Admin User', email: 'admin@acadence.edu', password, role: 'admin' },
    { name: 'Teacher User', email: 'faculty@acadence.edu', password, role: 'teacher' },
    { name: 'Student User', email: 'student@acadence.edu', password, role: 'student' }
  ];

  for (const user of users) {
    await User.findOneAndUpdate({ email: user.email }, user, { upsert: true, new: true });
  }

  console.log('Seeded users');
  process.exit(0);
}

seed().catch(console.error);
