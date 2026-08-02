import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

interface RegisterInput {
  email: string;
  password: string;
  orgName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

function generateTokens(userId: string, orgId: string, role: string) {
  const accessToken = jwt.sign(
    { userId, orgId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );

  const refreshToken = jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions
  );

  return { accessToken, refreshToken };
}

export async function registerUser({ email, password, orgName }: RegisterInput) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const organization = await prisma.organization.create({
    data: {
      name: orgName,
      users: {
        create: {
          email,
          passwordHash,
          role: 'ADMIN',
        },
      },
    },
    include: { users: true },
  });

  const user = organization.users[0];
  const tokens = generateTokens(user.id, organization.id, user.role);

  return { user, organization, ...tokens };
}

export async function loginUser({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const tokens = generateTokens(user.id, user.organizationId, user.role);
  return { user, ...tokens };
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
}

export async function refreshAccessToken(refreshToken: string) {
  const { userId } = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const tokens = generateTokens(user.id, user.organizationId, user.role);
  return tokens;
}