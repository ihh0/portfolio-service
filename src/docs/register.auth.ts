import { z } from "zod";
import { registry } from "./openapi";
import { ErrorResponse } from "./schemas";

const tokenResponse = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.string(),
  user: z.object({
    uid: z.string(),
    login_id: z.string(),
    display_name: z.string(),
    is_featured: z.boolean(),
  }),
});

const registerBody = z.object({
  login_id: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  display_name: z.string().min(1).max(50),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(30).optional(),
});

const loginBody = z.object({
  login_id: z.string(),
  password: z.string(),
});

const refreshBody = z.object({ refresh_token: z.string().min(10) });
const logoutBody = z.object({ refresh_token: z.string().min(10) });

const githubStartResponse = z.object({
  provider: z.literal("github"),
  url: z.string().url(),
});

const githubCallbackQuery = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

const firebaseBody = z.object({ id_token: z.string().min(10) });

// POST /auth/register
registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Local register",
  request: {
    body: { content: { "application/json": { schema: registerBody } } },
  },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: tokenResponse } } },
    409: { description: "Duplicate", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// POST /auth/login
registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Local login",
  request: {
    body: { content: { "application/json": { schema: loginBody } } },
  },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: tokenResponse } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// POST /auth/refresh
registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh tokens (rotation)",
  request: { body: { content: { "application/json": { schema: refreshBody } } } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: tokenResponse } } },
    401: { description: "Invalid/Revoked", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// POST /auth/logout
registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Logout (revoke refresh jti)",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: logoutBody } } } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: z.object({ ok: z.boolean() }) } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// GET /auth/oauth/github
registry.registerPath({
  method: "get",
  path: "/auth/oauth/github",
  tags: ["Auth"],
  summary: "GitHub OAuth start",
  responses: {
    200: { description: "OK", content: { "application/json": { schema: githubStartResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// GET /auth/oauth/github/callback
registry.registerPath({
  method: "get",
  path: "/auth/oauth/github/callback",
  tags: ["Auth"],
  summary: "GitHub OAuth callback",
  request: { query: githubCallbackQuery },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: tokenResponse } } },
    400: { description: "Bad request", content: { "application/json": { schema: ErrorResponse } } },
    401: { description: "Invalid state", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// POST /auth/firebase
registry.registerPath({
  method: "post",
  path: "/auth/firebase",
  tags: ["Auth"],
  summary: "Firebase login (verify idToken)",
  request: { body: { content: { "application/json": { schema: firebaseBody } } } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: tokenResponse } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});
