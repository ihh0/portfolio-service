import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { ExperiencesController } from "./experiences.controller";

const r = Router();
const c = new ExperiencesController();

const sizeSchema = z.union([z.literal(10), z.literal(20), z.literal(50)]).default(10);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.preprocess((v) => (typeof v === "string" ? Number(v) : v), sizeSchema),
});

const employmentTypeSchema = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "INTERN",
  "CONTRACT",
  "FREELANCE",
  "OTHER",
]);

const createSchema = z.object({
  company: z.string().min(1).max(100),
  position: z.string().min(1).max(100),
  employment_type: employmentTypeSchema,
  start_date: z.string().min(10).max(10),
  end_date: z.string().min(10).max(10).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

const patchSchema = createSchema.partial();

const uidParamSchema = z.object({
  uid: z.string().min(1),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

// public
r.get(
  "/users/:uid/experiences",
  validate(z.object({ params: uidParamSchema, query: listQuerySchema })),
  asyncHandler(c.listByUser.bind(c))
);
r.get("/experiences/:id", validate(z.object({ params: idParamSchema })), asyncHandler(c.getOne.bind(c)));

// owner/admin
r.post(
  "/users/:uid/experiences",
  requireAuth,
  validate(z.object({ params: uidParamSchema, body: createSchema })),
  asyncHandler(c.createForUser.bind(c))
);
r.patch(
  "/experiences/:id",
  requireAuth,
  validate(z.object({ params: idParamSchema, body: patchSchema })),
  asyncHandler(c.patch.bind(c))
);
r.delete(
  "/experiences/:id",
  requireAuth,
  validate(z.object({ params: idParamSchema })),
  asyncHandler(c.remove.bind(c))
);

export default r;
