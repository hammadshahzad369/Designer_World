import jwt from 'jsonwebtoken';
import { isObjectIdOrHexString } from 'mongoose';
import { roles } from '@storecraft/shared';

const tokenOptions = {
  issuer: 'storecraft',
  audience: 'storecraft-api',
};

export function issueAccessToken(account, role, secret) {
  const claims = { role };
  if (role === roles.owner) claims.businessId = account.id;
  return jwt.sign(claims, secret, {
    ...tokenOptions,
    subject: account.id,
    algorithm: 'HS256',
    expiresIn: '15m',
  });
}

export function authenticate(secret) {
  return (req, res, next) => {
    const match = req.get('authorization')?.match(/^Bearer (\S+)$/i);
    try {
      if (!match) return res.status(401).json({ error: 'Authentication required' });
      const claims = jwt.verify(match[1], secret, { ...tokenOptions, algorithms: ['HS256'] });
      if (!isObjectIdOrHexString(claims.sub) ||
          !Object.values(roles).includes(claims.role) ||
          (claims.role === roles.owner && claims.businessId !== claims.sub) ||
          ([roles.staff, roles.customer].includes(claims.role) && !isObjectIdOrHexString(claims.businessId))) {
        return res.status(401).json({ error: 'Invalid access token' });
      }
      req.auth = { userId: claims.sub, role: claims.role, businessId: claims.businessId };
    } catch {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }
    next();
  };
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.auth?.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
