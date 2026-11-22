import { z } from 'zod';

export function readConfig(env = process.env) {
  const schema = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
    JWT_ACCESS_SECRET: z.string().min(32),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  });
  const result = schema.safeParse(env);
  if (!result.success) {
    const names = result.error.issues.map(issue => issue.path.join('.'));
    throw new Error('Missing or invalid environment variables: ' + names.join(', '));
  }
  return result.data;
}
