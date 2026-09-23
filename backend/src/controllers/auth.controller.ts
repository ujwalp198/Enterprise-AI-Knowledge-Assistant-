import { Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, refreshAccessToken, inviteMember, listOrgUsers } from '../services/auth.service';
import { registerSchema, loginSchema } from '../services/auth.validation';
import prisma from '../config/db';

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await registerUser(parsed);
    res.status(201).json({
      user: { id: result.user.id, email: result.user.email, role: result.user.role },
      organization: { id: result.organization.id, name: result.organization.name },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await loginUser(parsed);
    res.status(200).json({
      user: { id: result.user.id, email: result.user.email, role: result.user.role },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed' });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    const tokens = await refreshAccessToken(refreshToken);
    res.status(200).json(tokens);
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        organization: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

const inviteSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function invite(req: Request, res: Response) {
  try {
    const parsed = inviteSchema.parse(req.body);
    const user = await inviteMember({
      ...parsed,
      organizationId: req.user!.orgId,
    });
    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to invite member' });
  }
}

export async function getOrgUsers(req: Request, res: Response) {
  try {
    const users = await listOrgUsers(req.user!.orgId);
    res.status(200).json({ users });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}
