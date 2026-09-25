import type { Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import type { AuthenticatedRequest, RegisterInput, LoginInput } from "../../types";

/**
 * Controller handling user registration
 * POST /api/auth/register
 */
export const registerHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: RegisterInput = req.body;
    const result = await AuthService.register(input);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling user login
 * POST /api/auth/login
 */
export const loginHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: LoginInput = req.body;
    const result = await AuthService.login(input);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving authenticated current user profile
 * GET /api/auth/me
 */
export const getMeHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: "fail",
        message: "Authentication required",
      });
      return;
    }

    const user = await AuthService.getCurrentUser(req.user.id);

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
