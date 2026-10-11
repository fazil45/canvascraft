import { OAuth2Client } from "google-auth-library";

const redirectUri =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000/auth/google/callback"
    : process.env.BACKEND_URL!;

export const googleClient = new OAuth2Client({
  client_id: process.env.GOOGLE_CLIENT_ID!,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uris: [redirectUri],
});
