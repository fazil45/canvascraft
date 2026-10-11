import dotenv from "dotenv";
import path from "node:path";

dotenv.config();

if (!process.env.JWT_SECRET) {
  dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
}

const jwtSecret = process.env.JWT_SECRET?.trim();

if (!jwtSecret) {
  throw new Error("JWT_SECRET must be configured for the backend");
}

export const SECRET_TOKEN = jwtSecret;
