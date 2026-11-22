import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../src/models/index.js';

const input = z.object({
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
  STORECRAFT_ADMIN_EMAIL: z.email().transform(email => email.toLowerCase()),
  STORECRAFT_ADMIN_PASSWORD: z.string().min(12).refine(password => Buffer.byteLength(password) <= 72),
}).safeParse(process.env);

if (!input.success) {
  console.error('Set MONGODB_URI, STORECRAFT_ADMIN_EMAIL and STORECRAFT_ADMIN_PASSWORD (12–72 bytes).');
  process.exitCode = 1;
} else {
  try {
    const { MONGODB_URI, STORECRAFT_ADMIN_EMAIL, STORECRAFT_ADMIN_PASSWORD } = input.data;
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await User.init();
    await User.create({
      name: 'Platform Admin', email: STORECRAFT_ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(STORECRAFT_ADMIN_PASSWORD, 12),
    });
    console.log('Platform admin created.');
  } catch (error) {
    console.error(error.code === 11000 ? 'A platform admin already exists with that email.' : 'Unable to create platform admin: ' + error.name);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
