import express, { NextFunction, Request, Response } from "express";
import userRouter from "./routes/auth.routes.js";
import roomRouter from "./routes/room.route.js";
import healthRouter from "./routes/health.route.js";
import { middleware } from "./middlewares/authMiddleware.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;
app.use(
  cors({
    origin: ["https://fazil-canvascraft.netlify.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/", userRouter);
app.use("/health", healthRouter);
app.use("/", middleware, roomRouter);

const u = new URL(process.env.DATABASE_URL ?? "postgres://missing");
console.log("adapter target:", u.hostname, u.port, "cwd:", process.cwd());

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
