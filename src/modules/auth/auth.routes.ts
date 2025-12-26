import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { AuthController } from "./auth.controller";

const r = Router();
const c = new AuthController();

const registerSchema = z.object({
  body: z.object({
    login_id: z.string().min(3).max(50),
    password: z.string().min(8).max(100),
    display_name: z.string().min(1).max(50),
    email: z.string().email().optional(),
    phone: z.string().min(7).max(30).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    login_id: z.string().min(1),
    password: z.string().min(1),
  }),
});

const refreshSchema = z.object({
  body: z.object({ refresh_token: z.string().min(10) }),
});

const logoutSchema = z.object({
  body: z.object({ refresh_token: z.string().min(10) }),
});

const firebaseSchema = z.object({
  body: z.object({ id_token: z.string().min(10) }),
});

// 로컬
r.post("/auth/register", validate(registerSchema), asyncHandler(c.register.bind(c)));
r.post("/auth/login", validate(loginSchema), asyncHandler(c.login.bind(c)));

// refresh / logout
r.post("/auth/refresh", validate(refreshSchema), asyncHandler(c.refresh.bind(c)));
r.post("/auth/logout", requireAuth, validate(logoutSchema), asyncHandler(c.logout.bind(c)));

// GitHub OAuth (고정)
r.get("/auth/oauth/github", asyncHandler(c.githubOauthStart.bind(c)));
r.get("/auth/oauth/github/callback", asyncHandler(c.githubOauthCallback.bind(c)));

// Firebase (Google)
r.post("/auth/firebase", validate(firebaseSchema), asyncHandler(c.firebaseLogin.bind(c)));

export default r;
