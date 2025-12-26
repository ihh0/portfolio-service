import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { requestLogger } from "./middleware/logger";
import { optionalAuth } from "./middleware/auth";
import { notFoundHandler, errorHandler } from "./middleware/error";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import projectsRoutes from "./modules/projects/projects.routes";
import skillsRoutes from "./modules/skills/skills.routes";
import experiencesRoutes from "./modules/experiences/experiences.routes";
import adminRoutes from "./modules/admin/admin.routes";

import "./docs/register.all";
import { createSwaggerRouter } from "./docs/swagger";

export const app = express();

app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// 요청/응답 요약 로그
app.use(requestLogger);

// 토큰이 있으면 req.auth 채움(없으면 통과)
app.use(optionalAuth);

// health (인증 없음)
app.get("/health", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    version: process.env.APP_VERSION ?? "dev",
    buildTime: process.env.BUILD_TIME ?? null,
  });
});

// routes
app.use(authRoutes);
app.use(usersRoutes);
app.use(projectsRoutes);
app.use(skillsRoutes);
app.use(experiencesRoutes);
app.use(adminRoutes);
app.use("/docs", createSwaggerRouter());

// 404 → error
app.use(notFoundHandler);
app.use(errorHandler);

export default app;