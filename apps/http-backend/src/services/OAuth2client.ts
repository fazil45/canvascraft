import { OAuth2Client } from "google-auth-library";

const backendUrl =
  process.env.BACKEND_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "");

const redirectUri = `${backendUrl}/auth/google/callback`;

export const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri,
});