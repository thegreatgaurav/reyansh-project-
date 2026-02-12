import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { Role } from '@prisma/client';
import { prisma } from '../../../db/prisma.js';
import { env } from '../../../config/env.js';

export async function loginWithEmail(email: string, password: string, role: Role) {
  const user = await prisma.user.findUnique({ where: { email }, include: { roles: true } });
  if (!user || !user.isActive) throw createHttpError(401, 'Invalid credentials');

  const hasRole = user.roles.some((r) => r.role === role);
  if (!hasRole) throw createHttpError(403, 'Role not allowed');

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw createHttpError(401, 'Invalid credentials');

  const session = await prisma.sessionToken.create({
    data: {
      userId: user.id,
      refreshHash: 'PENDING_ROTATION',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  const accessToken = jwt.sign({ sub: user.id, role, sessionId: session.id }, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL });
  const refreshToken = jwt.sign({ sub: user.id, role, sessionId: session.id }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL });

  await prisma.sessionToken.update({
    where: { id: session.id },
    data: { refreshHash: await bcrypt.hash(refreshToken, 10) }
  });

  return { accessToken, refreshToken };
}
