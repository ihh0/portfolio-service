import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { ProjectsController } from "./projects.controller";

const r = Router();
const c = new ProjectsController();

const sizeSchema = z.union([z.literal(10), z.literal(20), z.literal(50)]).default(10);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.preprocess((v) => (typeof v === "string" ? Number(v) : v), sizeSchema),
  sort: z.enum(["popular", "latest"]).default("popular"),
  title_keyword: z.string().optional(),
  content_keyword: z.string().optional(),
  user_keyword: z.string().optional(),
  skill_id: z.preprocess(
    (v) => (typeof v === "string" ? Number(v) : v),
    z.number().int().positive().optional()
  ),
});

const createSchema = z.object({
  title: z.string().min(1).max(150),
  summary: z.string().max(300).optional().nullable(),
  content: z.string().optional().nullable(),
  content_format: z.enum(["MARKDOWN", "PLAIN_TEXT"]).optional(),
  is_public: z.boolean().optional(),
  thumbnail_asset_id: z.number().int().positive().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  skill_ids: z.array(z.number().int().positive()).max(50).optional(),
});

const patchSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  summary: z.string().max(300).optional().nullable(),
  content: z.string().optional().nullable(),
  content_format: z.enum(["MARKDOWN", "PLAIN_TEXT"]).optional(),
  is_public: z.boolean().optional(),
  thumbnail_asset_id: z.number().int().positive().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  skill_ids: z.array(z.number().int().positive()).max(50).optional(),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

// 목록/조회: public
r.get("/projects", validate(z.object({ query: listQuerySchema })), asyncHandler(c.list.bind(c)));
r.get("/projects/:id", validate(z.object({ params: idParamSchema })), asyncHandler(c.getOne.bind(c)));

// 생성/수정/삭제: 인증 필요
r.post("/projects", requireAuth, validate(z.object({ body: createSchema })), asyncHandler(c.create.bind(c)));
r.patch(
  "/projects/:id",
  requireAuth,
  validate(z.object({ params: idParamSchema, body: patchSchema })),
  asyncHandler(c.patch.bind(c))
);
r.delete(
  "/projects/:id",
  requireAuth,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(c.delete.bind(c))
);

// 좋아요: 인증 필요
r.post(
  "/projects/:id/likes",
  requireAuth,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(c.like.bind(c))
);
r.delete(
  "/projects/:id/likes",
  requireAuth,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(c.unlike.bind(c))
);

export default r;
