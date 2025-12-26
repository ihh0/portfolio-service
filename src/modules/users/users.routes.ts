import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { UsersController } from "./users.controller";

const r = Router();
const c = new UsersController();

const sizeSchema = z.coerce.number().int().min(1).max(50).default(20);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: sizeSchema,
  keyword: z.string().optional(),
});

/**
 * 사용자 프로젝트 목록 조회용 쿼리 스키마
 * - title_keyword, content_keyword, user_keyword, skill_id는 이 엔드포인트에서 받지 않음 (user 고정이므로)
 */
const userProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.preprocess((v) => (typeof v === "string" ? Number(v) : v), sizeSchema),
  sort: z.enum(["popular", "latest"]).default("popular"),
});

const patchSchema = z
  .object({
    display_name: z.string().min(1).max(50).optional(),
    is_email_public: z.boolean().optional(),
    is_phone_public: z.boolean().optional(),
  })
  .strict();

const featuredSchema = z.object({
  is_featured: z.boolean(),
});

const uidParamSchema = z.object({
  uid: z.string().min(1),
});

// public
r.get("/users", validate(z.object({ query: listQuerySchema })), asyncHandler(c.list.bind(c)));
r.get("/users/:uid", validate(z.object({ params: uidParamSchema })), asyncHandler(c.getProfile.bind(c)));
r.get(
  "/users/:uid/projects",
  validate(z.object({ params: uidParamSchema, query: userProjectsQuerySchema })),
  asyncHandler(c.listProjects.bind(c))
);

// owner/admin
r.patch(
  "/users/:uid",
  requireAuth,
  validate(z.object({ params: uidParamSchema, body: patchSchema })),
  asyncHandler(c.patch.bind(c))
);
r.delete(
  "/users/:uid",
  requireAuth,
  validate(z.object({ params: uidParamSchema })),
  asyncHandler(c.delete.bind(c))
);

// admin-only
r.patch(
  "/users/:uid/featured",
  requireAuth,
  requireAdmin,
  validate(z.object({ params: uidParamSchema, body: featuredSchema })),
  asyncHandler(c.setFeatured.bind(c))
);

export default r;
