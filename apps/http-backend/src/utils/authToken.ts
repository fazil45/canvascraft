import { SECRET_TOKEN } from "@repo/backendcommon/secret";
import { Response } from "express";
import jwt from "jsonwebtoken";
import { cookieOptions } from "./cookieOptions.js";
import crypto from "crypto";

export const createToken = (userId: string) =>
  jwt.sign({ userId }, SECRET_TOKEN, { expiresIn: "7d" });

export const setAuthCookie = (res: Response, userId: string) =>
  res.cookie("token", createToken(userId), cookieOptions);

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");
