import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { verify } from 'jsonwebtoken';
import { JwtPayload } from '../modules/auth/types/jwt-payload.type';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // Extract JWT token from Authorization header
  const authHeader = req.headers.authorization;
  let user: JwtPayload | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Verify and decode JWT token
      const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      user = {
        userId: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      // Token is invalid or expired, user remains null
      user = null;
    }
  }

  return {
    req,
    res,
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
