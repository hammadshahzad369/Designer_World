import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { roles } from '@storecraft/shared';
import { Business, User } from '../models/index.js';
import { issueAccessToken } from '../middleware/auth.js';

const credentials = z.strictObject({
  email: z.email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(1).refine(value => Buffer.byteLength(value) <= 72),
  portal: z.enum(['dashboard', 'super-admin']).default('dashboard'),
});

export function login(secret) {
  return async (req, res) => {
    const result = credentials.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Invalid login request' });

    const { email, password, portal } = result.data;
    const isPlatform = portal === 'super-admin';
    const account = isPlatform
      ? await User.findOne({ email }).select('+passwordHash')
      : await Business.findOne({
        email,
        subscriptionStatus: { $in: ['active', 'trial'] },
      }).select('+passwordHash');

    if (!account || !await bcrypt.compare(password, account.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const role = isPlatform ? roles.platform : roles.owner;
    res.set('Cache-Control', 'no-store').json({
      accessToken: issueAccessToken(account, role, secret),
      expiresIn: 900,
      role,
    });
  };
}
