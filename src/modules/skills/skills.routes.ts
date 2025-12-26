import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { SkillsController } from "./skills.controller";

const r = Router();
const c = new SkillsController();

const listQuerySchema = z.object({
  keyword: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(50),
});

const patchSchema = z.object({
  name: z.string().min(1).max(50).optional(),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

r.get("/skills", validate(z.object({ query: listQuerySchema })), asyncHandler(c.list.bind(c)));

// admin-only (access token 필요)
r.post(
  "/skills",
  requireAuth,
  requireAdmin,
  validate(z.object({ body: createSchema })),
  asyncHandler(c.create.bind(c))
);
r.patch(
  "/skills/:id",
  requireAuth,
  requireAdmin,
  validate(z.object({ params: idParamSchema, body: patchSchema })),
  asyncHandler(c.patch.bind(c))
);
r.delete(
  "/skills/:id",
  requireAuth,
  requireAdmin,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(c.remove.bind(c))
);

export default r;
