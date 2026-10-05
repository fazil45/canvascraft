import express from "express";
import userRouter from "./routes/auth.routes.js";
import roomRouter from "./routes/room.route.js";
import healthRouter from "./routes/health.route.js";
import { middleware } from "./middlewares/authMiddleware.js";
import cookieParser from "cookie-parser";
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
app.use(cookieParser())

app.use("/", userRouter);
app.use("/health", healthRouter);
app.use("/", middleware, roomRouter);


app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
