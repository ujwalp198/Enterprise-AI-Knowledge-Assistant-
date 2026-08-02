import { Request, Response } from 'express';
import { registerUser, loginUser, refreshAccessToken } from '../services/auth.service';
import { registerSchema, loginSchema } from '../services/auth.validation';

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