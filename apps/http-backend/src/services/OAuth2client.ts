import { OAuth2Client } from "google-auth-library";

export const googleClient = new OAuth2Client({
  client_id: process.env.GOOGLE_CLIENT_ID!,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uris: [
    process.env.GOOGLE_REDIRECT_URI ??
      "http://localhost:4000/auth/google/callback",
  ],
});
