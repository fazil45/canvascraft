import { OAuth2Client } from "google-auth-library";

const redirectUri =
  process.env.GOOGLE_REDIRECT_URI ??
  `${process.env.BACKEND_URL ?? "http://localhost:4000"}/auth/google/callback`;

export const googleClient = new OAuth2Client({
  client_id: process.env.GOOGLE_CLIENT_ID!,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uris: [redirectUri],
});
