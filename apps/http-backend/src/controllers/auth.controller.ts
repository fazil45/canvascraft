import "dotenv/config"
import {
  CreateUserSchema,
  SigninSchema,
  UpdateProfileSchema,
} from "@repo/common/types";
import { prisma } from "@repo/db/client";
import bcrypt from "bcrypt";
import {  Request, Response } from "express";
import crypto from "node:crypto";
import { sendEmail } from "../services/email.js";
import { googleClient } from "../services/OAuth2client.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import { hashToken, setAuthCookie } from "../utils/authToken.js";

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

const issueVerification = async (userId: string, email: string) => {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationTokenHash: hashToken(token),
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await sendEmail(email, token);
};

export const signup = async (req: Request, res: Response) => {
  try {
    const parseData = CreateUserSchema.safeParse(req.body);

    if (!parseData.success)
      return res
        .status(400)
        .json({ success: false, error: "Incorrect inputs" });

    const { email, password, name } = parseData.data;

    if (await prisma.user.findUnique({ where: { email } })) {
      return res
        .status(409)
        .json({ success: false, error: "Email is already registered" });
    }

    const user = await prisma.user.create({
      data: { email, name, password: await bcrypt.hash(password, 10) },
    });

    await issueVerification(user.id, email);

    return res.status(201).json({
      success: true,
      message: "Account created. Check your email to verify it.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to sign up" });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const parsedData = SigninSchema.safeParse(req.body);

    if (!parsedData.success)
      return res.status(400).json({ success: false, error: "Incorrect input" });

    const user = await prisma.user.findUnique({
      where: { email: parsedData.data.email },
    });

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(parsedData.data.password, user.password))
    ) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    if (!user.emailVerifiedAt)
      return res
        .status(403)
        .json({ success: false, error: "Please verify your email first" });
    setAuthCookie(res, user.id);
    return res
      .status(200)
      .json({ success: true, message: "Signin successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to sign in" });
  }
};

export const signout = async (_req: Request, res: Response) => {
  res.clearCookie("token", cookieOptions);
  return res
    .status(200)
    .json({ success: true, message: "Signed out successfully" });
};

export const me = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        emailVerifiedAt: true,
      },
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Please sign in" });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to load user" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const parsedData = UpdateProfileSchema.safeParse(req.body);
    if (!parsedData.success)
      return res.status(400).json({ success: false, error: "Invalid name" });

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name: parsedData.data.name },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        emailVerifiedAt: true,
      },
    });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to update profile" });
  }
};

export const googleStart = (_req: Request, res: Response) => {
  const state = crypto.randomBytes(24).toString("hex");
  res.cookie("google_oauth_state", state, cookieOptions);
  return res.redirect(
    googleClient.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      state,
      prompt: "select_account",
    }),
  );
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    if (!req.query.code || req.query.state !== req.cookies.google_oauth_state) {
      return res.redirect(`${frontendUrl}/signin?error=google_auth`);
    }
    const { tokens } = await googleClient.getToken(String(req.query.code));
    if (!tokens.id_token) throw new Error("Google did not return an ID token");
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email)
      throw new Error("Google profile is incomplete");

    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId: payload.sub,
            emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
            photo: existingUser.photo ?? payload.picture,
            name: existingUser.name ?? payload.name,
          },
        })
      : await prisma.user.create({
          data: {
            email: payload.email,
            googleId: payload.sub,
            name: payload.name,
            photo: payload.picture,
            emailVerifiedAt: new Date(),
          },
        });

    res.clearCookie("google_oauth_state", cookieOptions);
    setAuthCookie(res, user.id);
    return res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error(error);
    return res.redirect(`${frontendUrl}/signin?error=google_auth`);
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const user = await prisma.user.findFirst({
      where: {
        verificationTokenHash: hashToken(token),
        verificationTokenExpiresAt: { gt: new Date() },
      },
    });
    if (!user) return res.redirect(`${frontendUrl}/signin?verified=invalid`);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
      },
    });
    return res.redirect(`${frontendUrl}/signin?verified=success`);
  } catch (error) {
    console.error(error);
    return res.redirect(`${frontendUrl}/signin?verified=invalid`);
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email : "";
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerifiedAt)
      await issueVerification(user.id, user.email);
    return res.status(200).json({
      success: true,
      message: "If the account exists, a verification email was sent",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to send verification email" });
  }
};
