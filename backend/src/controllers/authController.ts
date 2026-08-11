import type { Request, Response } from 'express';
import { User, type UserDoc } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { track } from '../config/posthog.js';
import type { RegisterInput, LoginInput } from '../validators/authValidators.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, displayName, role, walletAddress } = req.body as RegisterInput;

  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const passwordHash = await (User as unknown as { hashPassword(p: string): Promise<string> }).hashPassword(
    password,
  );
  const user = await User.create({ email, passwordHash, displayName, role, walletAddress });

  const accessToken = signAccessToken({ sub: user.id, role: user.role, tokenVersion: user.tokenVersion });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role, tokenVersion: user.tokenVersion });

  track(user.id, 'user_registered', { role });

  res.status(201).json({
    user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
    accessToken,
    refreshToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = (await User.findOne({ email }).select('+passwordHash')) as UserDoc | null;
  if (!user || !user.isActive) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role, tokenVersion: user.tokenVersion });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role, tokenVersion: user.tokenVersion });

  track(user.id, 'user_logged_in');

  res.json({
    user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
    accessToken,
    refreshToken,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    throw AppError.unauthorized('Refresh token no longer valid');
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role, tokenVersion: user.tokenVersion });
  res.json({ accessToken });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw AppError.notFound('User not found');
  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      walletAddress: user.walletAddress,
    },
  });
});
