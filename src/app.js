import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

//Import Pages
import userRoutes from "./routes/user.routes.js";

// routes Declerations
const version = "/api/v1";
app.use(`${version}/user`, userRoutes);

export default app;
