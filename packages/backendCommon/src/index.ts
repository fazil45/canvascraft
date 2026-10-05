import dotenv from "dotenv";

dotenv.config();

export const SECRET_TOKEN = process.env.JWT_SECRET || "1234asadfsfdsa";

