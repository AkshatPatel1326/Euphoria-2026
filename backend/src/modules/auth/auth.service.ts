import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import type { User } from "../../../generated/prisma/client";
import { Role } from "../../../generated/prisma/client";
import type {
  RegisterInput,
  LoginInput,
  SafeUser,
  AuthResponseData,
  JwtUserPayload,
} from "../../types";

import { HttpError } from "../../lib/errors";
import { getJwtSecret } from "../../lib/jwtConfig";
export { HttpError };

const JWT_SECRET: string = getJwtSecret();
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

export class AuthService {
  /**
   * Helper to strip sensitive fields (passwordHash) and return a safe user representation
   */
  public static toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      participantCategory: user.participantCategory,
      scholarNumber: user.scholarNumber,
      enrollmentNumber: user.enrollmentNumber,
      collegeName: user.collegeName,
      course: user.course,
      year: user.year,
      city: user.city,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Generates a signed JWT token for the user
   */
  public static generateToken(payload: JwtUserPayload): string {
    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
    };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  /**
   * Registers a new participant user
   */
  public static async register(input: RegisterInput): Promise<AuthResponseData> {
    const {
      name,
      email,
      password,
      phone,
      participantCategory,
      scholarNumber,
      enrollmentNumber,
      collegeName,
      course,
      year,
      city,
    } = input;

    // 1. Basic validation
    if (!name || name.trim() === "") {
      throw new HttpError("Name is required", 400);
    }

    if (!email || email.trim() === "") {
      throw new HttpError("Email is required", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      throw new HttpError("Please provide a valid email address", 400);
    }

    if (!password || password.length < 6) {
      throw new HttpError("Password must be at least 6 characters long", 400);
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new HttpError("A user with this email address already exists", 409);
    }

    // 3. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Create user in database
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone?.trim() || null,
        role: Role.PARTICIPANT,
        participantCategory: participantCategory || null,
        scholarNumber: scholarNumber?.trim() || null,
        enrollmentNumber: enrollmentNumber?.trim() || null,
        collegeName: collegeName?.trim() || null,
        course: course?.trim() || null,
        year: year?.trim() || null,
        city: city?.trim() || null,
        isEmailVerified: false,
      },
    });

    // 5. Generate JWT token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.toSafeUser(user),
      token,
    };
  }

  /**
   * Authenticates user and returns JWT token
   */
  public static async login(input: LoginInput): Promise<AuthResponseData> {
    const { email, password } = input;

    if (!email || email.trim() === "") {
      throw new HttpError("Email is required", 400);
    }

    if (!password || password.trim() === "") {
      throw new HttpError("Password is required", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      throw new HttpError("Invalid email or password", 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new HttpError("Invalid email or password", 401);
    }

    // Generate JWT token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.toSafeUser(user),
      token,
    };
  }

  /**
   * Retrieves the current user profile by user ID
   */
  public static async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpError("User not found", 404);
    }

    return this.toSafeUser(user);
  }
}
